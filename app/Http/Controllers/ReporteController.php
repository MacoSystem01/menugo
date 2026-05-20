<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\KitchenNote;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReporteController extends Controller
{
    // ── Vista principal ───────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $desde = $request->filled('desde') ? $request->desde : now()->startOfMonth()->format('Y-m-d');
        $hasta = $request->filled('hasta') ? $request->hasta : now()->format('Y-m-d');

        $ventas = Order::whereNotIn('status', ['cancelled'])
            ->whereBetween(DB::raw('DATE(created_at)'), [$desde, $hasta]);

        $totalVentas      = (float) $ventas->sum('total');
        $totalPedidos     = $ventas->count();
        $pedidosMesa      = (clone $ventas)->where('type', 'mesa')->count();
        $pedidosDomicilio = (clone $ventas)->where('type', 'domicilio')->count();
        $ticketPromedio   = $totalPedidos > 0 ? round($totalVentas / $totalPedidos, 2) : 0;

        $topPlatos = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('dishes', 'dishes.id', '=', 'order_items.dish_id')
            ->whereNotIn('orders.status', ['cancelled'])
            ->whereBetween(DB::raw('DATE(orders.created_at)'), [$desde, $hasta])
            ->groupBy('dishes.id', 'dishes.name')
            ->select('dishes.name', DB::raw('SUM(order_items.quantity) as vendidos'), DB::raw('SUM(order_items.quantity * order_items.unit_price) as ingresos'))
            ->orderByDesc('vendidos')->take(10)->get();

        $ventasPorDia = Order::whereNotIn('status', ['cancelled'])
            ->whereBetween(DB::raw('DATE(created_at)'), [$desde, $hasta])
            ->groupBy('fecha')
            ->select(DB::raw('DATE(created_at) as fecha'), DB::raw('SUM(total) as total'), DB::raw('COUNT(*) as pedidos'))
            ->orderBy('fecha')->get();

        $novedades = KitchenNote::whereBetween(DB::raw('DATE(created_at)'), [$desde, $hasta])
            ->groupBy('type')->select('type', DB::raw('COUNT(*) as total'))->get();

        $inventarioCritico = InventoryItem::whereIn('status', ['bajo', 'agotado', 'vencido'])
            ->orderBy('status')->orderBy('name')->get(['id', 'name', 'quantity', 'unit', 'status']);

        return Inertia::render('Reporte', [
            'resumen' => [
                'total_ventas'      => $totalVentas,
                'total_pedidos'     => $totalPedidos,
                'pedidos_mesa'      => $pedidosMesa,
                'pedidos_domicilio' => $pedidosDomicilio,
                'ticket_promedio'   => $ticketPromedio,
            ],
            'top_platos'         => $topPlatos,
            'ventas_por_dia'     => $ventasPorDia,
            'novedades'          => $novedades,
            'inventario_critico' => $inventarioCritico,
            'filters'            => ['desde' => $desde, 'hasta' => $hasta],
        ]);
    }

    // ── Exportar ──────────────────────────────────────────────────────────────

    public function exportar(Request $request)
    {
        $tipo    = $request->input('tipo', 'pedidos');
        $formato = $request->input('formato', 'xlsx');
        $desde   = $request->input('desde', now()->startOfMonth()->format('Y-m-d'));
        $hasta   = $request->input('hasta', now()->format('Y-m-d'));

        [$titulo, $headers, $rows, $totals] = $this->buildReporte($tipo, $desde, $hasta);

        $filename = "{$tipo}_{$desde}_{$hasta}";

        return $formato === 'pdf'
            ? $this->exportPdf($titulo, $headers, $rows, $totals, $desde, $hasta, $filename)
            : $this->exportXlsx($titulo, $headers, $rows, $totals, $filename);
    }

    // ── Datos por tipo ────────────────────────────────────────────────────────

    private function buildReporte(string $tipo, string $desde, string $hasta): array
    {
        return match ($tipo) {
            'caja'       => $this->reporteCaja($desde, $hasta),
            'pedidos'    => $this->reportePedidos($desde, $hasta),
            'cocina'     => $this->reporteCocina($desde, $hasta),
            'novedades'  => $this->reporteNovedades($desde, $hasta),
            'mesa'       => $this->reporteMesa($desde, $hasta),
            'domicilio'  => $this->reporteDomicilio($desde, $hasta),
            'inventario' => $this->reporteInventario($desde, $hasta),
            default      => $this->reportePedidos($desde, $hasta),
        };
    }

    private function fmt(float $n): string
    {
        return '$ ' . number_format($n, 0, ',', '.');
    }

    // ── 1. Caja ───────────────────────────────────────────────────────────────

    private function reporteCaja(string $desde, string $hasta): array
    {
        $orders = Order::with('table')
            ->where('amount_paid', '>', 0)
            ->whereBetween(DB::raw('DATE(created_at)'), [$desde, $hasta])
            ->orderBy('created_at')
            ->get();

        $headers = [
            ['label' => '#Pedido',    'align' => ''],
            ['label' => 'Cliente',    'align' => ''],
            ['label' => 'Tipo',       'align' => 'center'],
            ['label' => 'Mesa',       'align' => 'center'],
            ['label' => 'Método',     'align' => ''],
            ['label' => 'Total',      'align' => 'right'],
            ['label' => 'Cobrado',    'align' => 'right'],
            ['label' => 'Estado pago','align' => 'center'],
            ['label' => 'Fecha',      'align' => ''],
        ];

        $rows = $orders->map(fn($o) => [
            '#' . $o->id,
            $o->customer_name,
            $o->type === 'mesa' ? 'Mesa' : 'Domicilio',
            $o->table?->number ?? '—',
            $o->payment_method ?? '—',
            $this->fmt((float) $o->total),
            $this->fmt((float) $o->amount_paid),
            (float) $o->amount_paid >= (float) $o->total ? 'Pagado' : 'Parcial',
            $o->created_at->format('d/m/Y H:i'),
        ])->toArray();

        $totalCobrado = $orders->sum('amount_paid');
        $totals = [
            ['value' => 'TOTAL', 'align' => ''],
            ['value' => '', 'align' => ''], ['value' => '', 'align' => ''], ['value' => '', 'align' => ''],
            ['value' => '', 'align' => ''],
            ['value' => $this->fmt($orders->sum('total')), 'align' => 'right'],
            ['value' => $this->fmt($totalCobrado),          'align' => 'right'],
            ['value' => '', 'align' => ''], ['value' => '', 'align' => ''],
        ];

        return ['Reporte de Caja — Pagos', $headers, $rows, $totals];
    }

    // ── 2. Pedidos ────────────────────────────────────────────────────────────

    private function reportePedidos(string $desde, string $hasta): array
    {
        $orders = Order::with('table')
            ->whereBetween(DB::raw('DATE(created_at)'), [$desde, $hasta])
            ->orderBy('created_at')
            ->get();

        $statusLabel = [
            'pending' => 'Pendiente', 'at_cash' => 'En caja', 'in_kitchen' => 'En cocina',
            'cooking' => 'Cocinando', 'ready' => 'Listo', 'delivered' => 'Entregado', 'cancelled' => 'Cancelado',
        ];

        $headers = [
            ['label' => '#',       'align' => ''],
            ['label' => 'Cliente', 'align' => ''],
            ['label' => 'Teléfono','align' => ''],
            ['label' => 'Tipo',    'align' => 'center'],
            ['label' => 'Mesa/Dir','align' => ''],
            ['label' => 'Estado',  'align' => 'center'],
            ['label' => 'Total',   'align' => 'right'],
            ['label' => 'Cobrado', 'align' => 'right'],
            ['label' => 'Método',  'align' => ''],
            ['label' => 'Fecha',   'align' => ''],
        ];

        $rows = $orders->map(fn($o) => [
            '#' . $o->id,
            $o->customer_name,
            $o->customer_phone,
            $o->type === 'mesa' ? 'Mesa' : 'Domicilio',
            $o->type === 'mesa' ? ('Mesa ' . ($o->table?->number ?? '—')) : ($o->delivery_address ?? '—'),
            $statusLabel[$o->status] ?? $o->status,
            $this->fmt((float) $o->total),
            $this->fmt((float) $o->amount_paid),
            $o->payment_method ?? '—',
            $o->created_at->format('d/m/Y H:i'),
        ])->toArray();

        $totals = [
            ['value' => 'TOTAL', 'align' => ''],
            ['value' => $orders->count() . ' pedidos', 'align' => ''],
            ['value' => '', 'align' => ''], ['value' => '', 'align' => ''], ['value' => '', 'align' => ''],
            ['value' => '', 'align' => ''],
            ['value' => $this->fmt($orders->sum('total')), 'align' => 'right'],
            ['value' => $this->fmt($orders->sum('amount_paid')), 'align' => 'right'],
            ['value' => '', 'align' => ''], ['value' => '', 'align' => ''],
        ];

        return ['Reporte de Pedidos', $headers, $rows, $totals];
    }

    // ── 3. Cocina ─────────────────────────────────────────────────────────────

    private function reporteCocina(string $desde, string $hasta): array
    {
        $orders = Order::with(['table', 'items.dish'])
            ->whereBetween(DB::raw('DATE(created_at)'), [$desde, $hasta])
            ->orderBy('created_at')
            ->get();

        $statusLabel = [
            'pending' => 'Pendiente', 'at_cash' => 'En caja', 'in_kitchen' => 'En cocina',
            'cooking' => 'Cocinando', 'ready' => 'Listo', 'delivered' => 'Entregado', 'cancelled' => 'Cancelado',
        ];

        $headers = [
            ['label' => '#Pedido',    'align' => ''],
            ['label' => 'Mesa/Tipo',  'align' => ''],
            ['label' => 'Productos',  'align' => ''],
            ['label' => 'Estado',     'align' => 'center'],
            ['label' => 'Fecha',      'align' => ''],
            ['label' => 'Total',      'align' => 'right'],
        ];

        $rows = $orders->map(fn($o) => [
            '#' . $o->id,
            $o->type === 'mesa' ? ('Mesa ' . ($o->table?->number ?? '—')) : 'Domicilio',
            $o->items->map(fn($i) => "{$i->quantity}x {$i->dish?->name}")->implode(', '),
            $statusLabel[$o->status] ?? $o->status,
            $o->created_at->format('d/m/Y H:i'),
            $this->fmt((float) $o->total),
        ])->toArray();

        $totals = [
            ['value' => 'TOTAL', 'align' => ''],
            ['value' => $orders->count() . ' pedidos', 'align' => ''],
            ['value' => '', 'align' => ''],
            ['value' => '', 'align' => ''],
            ['value' => '', 'align' => ''],
            ['value' => $this->fmt($orders->sum('total')), 'align' => 'right'],
        ];

        return ['Reporte General de Cocina (Pedidos)', $headers, $rows, $totals];
    }

    private function reporteNovedades(string $desde, string $hasta): array
    {
        $notes = KitchenNote::with(['verifiedBy'])
            ->whereBetween(DB::raw('DATE(created_at)'), [$desde, $hasta])
            ->orderBy('created_at')
            ->get();

        $typeLabel = [
            'quemado' => 'Quemado', 'cancelado' => 'Cancelado',
            'devuelto' => 'Devuelto', 'dañado' => 'Dañado', 'otro' => 'Otro',
        ];

        $headers = [
            ['label' => '#',          'align' => ''],
            ['label' => 'Tipo',       'align' => ''],
            ['label' => 'Descripción','align' => ''],
            ['label' => 'Pedido',     'align' => 'center'],
            ['label' => 'Plato',      'align' => ''],
            ['label' => 'Registrado', 'align' => ''],
            ['label' => 'Fecha',      'align' => ''],
            ['label' => 'Verificado', 'align' => ''],
        ];

        $rows = $notes->map(fn($n) => [
            $n->id,
            $typeLabel[$n->type] ?? $n->type,
            $n->description,
            $n->order_id ? '#' . $n->order_id : '—',
            $n->dish ?? '—',
            $n->author ?? '—',
            $n->created_at->format('d/m/Y H:i'),
            $n->verified_at ? ($n->verifiedBy?->name . ' ' . $n->verified_at->format('d/m/Y')) : 'Pendiente',
        ])->toArray();

        return ['Reporte de Novedades de Cocina', $headers, $rows, null];
    }

    // ── 4. Mesa ───────────────────────────────────────────────────────────────

    private function reporteMesa(string $desde, string $hasta): array
    {
        $orders = Order::with(['table', 'items.dish'])
            ->where('type', 'mesa')
            ->whereBetween(DB::raw('DATE(created_at)'), [$desde, $hasta])
            ->orderBy('table_id')
            ->orderBy('created_at')
            ->get();

        $statusLabel = [
            'pending' => 'Pendiente', 'at_cash' => 'En caja', 'in_kitchen' => 'En cocina',
            'cooking' => 'Cocinando', 'ready' => 'Listo', 'delivered' => 'Entregado', 'cancelled' => 'Cancelado',
        ];

        $headers = [
            ['label' => 'Mesa',      'align' => 'center'],
            ['label' => '#Pedido',   'align' => ''],
            ['label' => 'Cliente',   'align' => ''],
            ['label' => 'Productos', 'align' => ''],
            ['label' => 'Estado',    'align' => 'center'],
            ['label' => 'Total',     'align' => 'right'],
            ['label' => 'Cobrado',   'align' => 'right'],
            ['label' => 'Fecha',     'align' => ''],
        ];

        $rows = $orders->map(fn($o) => [
            'Mesa ' . ($o->table?->number ?? '—'),
            '#' . $o->id,
            $o->customer_name,
            $o->items->map(fn($i) => "{$i->quantity}x {$i->dish?->name}")->implode(', '),
            $statusLabel[$o->status] ?? $o->status,
            $this->fmt((float) $o->total),
            $this->fmt((float) $o->amount_paid),
            $o->created_at->format('d/m/Y H:i'),
        ])->toArray();

        $totals = [
            ['value' => 'TOTAL', 'align' => ''],
            ['value' => $orders->count() . ' pedidos', 'align' => ''],
            ['value' => '', 'align' => ''], ['value' => '', 'align' => ''], ['value' => '', 'align' => ''],
            ['value' => $this->fmt($orders->sum('total')),       'align' => 'right'],
            ['value' => $this->fmt($orders->sum('amount_paid')), 'align' => 'right'],
            ['value' => '', 'align' => ''],
        ];

        return ['Reporte de Pedidos por Mesa', $headers, $rows, $totals];
    }

    // ── 5. Domicilio ──────────────────────────────────────────────────────────

    private function reporteDomicilio(string $desde, string $hasta): array
    {
        $orders = Order::with('deliveryUser')
            ->where('type', 'domicilio')
            ->whereBetween(DB::raw('DATE(created_at)'), [$desde, $hasta])
            ->orderBy('delivery_user_id')
            ->orderBy('created_at')
            ->get();

        $statusLabel = ['ready' => 'Listo', 'delivered' => 'Entregado', 'cancelled' => 'Cancelado'];

        $headers = [
            ['label' => 'Repartidor',  'align' => ''],
            ['label' => '#Pedido',     'align' => ''],
            ['label' => 'Cliente',     'align' => ''],
            ['label' => 'Teléfono',    'align' => ''],
            ['label' => 'Dirección',   'align' => ''],
            ['label' => 'Total',       'align' => 'right'],
            ['label' => 'Estado',      'align' => 'center'],
            ['label' => 'Entregado',   'align' => ''],
            ['label' => 'Fecha',       'align' => ''],
        ];

        $rows = $orders->map(fn($o) => [
            $o->deliveryUser?->name ?? 'Sin asignar',
            '#' . $o->id,
            $o->customer_name,
            $o->customer_phone,
            $o->delivery_address ?? '—',
            $this->fmt((float) $o->total),
            $statusLabel[$o->status] ?? $o->status,
            $o->delivered_at?->format('d/m/Y H:i') ?? '—',
            $o->created_at->format('d/m/Y H:i'),
        ])->toArray();

        $totals = [
            ['value' => 'TOTAL', 'align' => ''],
            ['value' => $orders->count() . ' domicilios', 'align' => ''],
            ['value' => '', 'align' => ''], ['value' => '', 'align' => ''], ['value' => '', 'align' => ''],
            ['value' => $this->fmt($orders->sum('total')), 'align' => 'right'],
            ['value' => '', 'align' => ''], ['value' => '', 'align' => ''], ['value' => '', 'align' => ''],
        ];

        return ['Reporte de Domicilios', $headers, $rows, $totals];
    }

    // ── 6. Inventario ─────────────────────────────────────────────────────────

    private function reporteInventario(string $desde, string $hasta): array
    {
        $items = InventoryItem::orderBy('status')->orderBy('name')->get();

        $statusLabel = ['ok' => 'OK', 'bajo' => 'Stock bajo', 'agotado' => 'Agotado', 'vencido' => 'Vencido'];

        $headers = [
            ['label' => 'Producto',     'align' => ''],
            ['label' => 'Cantidad',     'align' => 'right'],
            ['label' => 'Unidad',       'align' => ''],
            ['label' => 'Precio unit.', 'align' => 'right'],
            ['label' => 'Valor total',  'align' => 'right'],
            ['label' => 'Estado',       'align' => 'center'],
            ['label' => 'Vencimiento',  'align' => ''],
            ['label' => 'Notas',        'align' => ''],
        ];

        $rows = $items->map(fn($i) => [
            $i->name,
            number_format((float) $i->quantity, 2, ',', '.'),
            $i->unit ?: '—',
            $this->fmt((float) $i->unit_price),
            $this->fmt((float) $i->total_value),
            $statusLabel[$i->status] ?? $i->status,
            $i->expiry_date?->format('d/m/Y') ?? '—',
            $i->notes ?? '—',
        ])->toArray();

        $totals = [
            ['value' => 'TOTAL BODEGA', 'align' => ''],
            ['value' => '', 'align' => ''], ['value' => '', 'align' => ''],
            ['value' => '', 'align' => ''],
            ['value' => $this->fmt($items->sum('total_value')), 'align' => 'right'],
            ['value' => $items->count() . ' artículos', 'align' => 'center'],
            ['value' => '', 'align' => ''], ['value' => '', 'align' => ''],
        ];

        return ['Reporte de Inventario (Bodega)', $headers, $rows, $totals];
    }

    // ── Generar PDF ───────────────────────────────────────────────────────────

    private function exportPdf(string $titulo, array $headers, array $rows, ?array $totals, string $desde, string $hasta, string $filename)
    {
        $pdf = Pdf::loadView('exports.reporte', compact('titulo', 'headers', 'rows', 'totals', 'desde', 'hasta'))
            ->setPaper('a4', count($headers) > 7 ? 'landscape' : 'portrait');

        return response($pdf->output(), 200, [
            'Content-Type'              => 'application/pdf',
            'Content-Disposition'       => 'attachment; filename="' . $filename . '.pdf"',
            'X-Content-Type-Options'    => 'nosniff',
            'Cache-Control'             => 'no-store, no-cache, must-revalidate',
            'Pragma'                    => 'no-cache',
        ]);
    }

    // ── Generar XLSX ──────────────────────────────────────────────────────────

    private function exportXlsx(string $titulo, array $headers, array $rows, ?array $totals, string $filename): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle(mb_substr($titulo, 0, 31));

        // Title row
        $sheet->setCellValue('A1', $titulo);
        $sheet->mergeCells('A1:' . \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($headers)) . '1');
        $sheet->getStyle('A1')->applyFromArray([
            'font'      => ['bold' => true, 'size' => 13, 'color' => ['argb' => 'FFFFFFFF']],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF1E293B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'indent' => 1],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(24);

        // Header row
        $colIdx = 1;
        foreach ($headers as $h) {
            $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx++);
            $sheet->setCellValue("{$col}2", $h['label']);
        }
        $headerRange = 'A2:' . \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($headers)) . '2';
        $sheet->getStyle($headerRange)->applyFromArray([
            'font'      => ['bold' => true, 'color' => ['argb' => 'FF1E293B']],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFF1F5F9']],
            'borders'   => ['bottom' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['argb' => 'FFCBD5E1']]],
        ]);
        $sheet->getRowDimension(2)->setRowHeight(18);

        // Data rows
        $rowNum = 3;
        foreach ($rows as $row) {
            $colIdx = 1;
            foreach ($row as $cell) {
                $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx++);
                $sheet->setCellValue("{$col}{$rowNum}", $cell);
            }
            if ($rowNum % 2 === 0) {
                $sheet->getStyle("A{$rowNum}:" . \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($headers)) . $rowNum)
                    ->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF8FAFC');
            }
            $rowNum++;
        }

        // Totals row
        if ($totals) {
            $colIdx = 1;
            foreach ($totals as $t) {
                $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx++);
                $sheet->setCellValue("{$col}{$rowNum}", $t['value']);
            }
            $totalRange = "A{$rowNum}:" . \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($headers)) . $rowNum;
            $sheet->getStyle($totalRange)->applyFromArray([
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF1E293B']],
            ]);
        }

        // Auto-width columns
        for ($i = 1; $i <= count($headers); $i++) {
            $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i);
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Borders on data
        if ($rowNum > 3) {
            $dataRange = "A2:" . \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($headers)) . ($rowNum - 1);
            $sheet->getStyle($dataRange)->getBorders()->getAllBorders()
                ->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB('FFE5E7EB');
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, "{$filename}.xlsx", [
            'Content-Type'           => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition'    => 'attachment; filename="' . $filename . '.xlsx"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control'          => 'no-store, no-cache, must-revalidate',
            'Pragma'                 => 'no-cache',
        ]);
    }
}
