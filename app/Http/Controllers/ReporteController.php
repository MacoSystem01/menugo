<?php

namespace App\Http\Controllers;

use App\Models\Gasto;
use App\Models\Order;
use App\Models\KitchenNote;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Carbon\Carbon;
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
        if (!\App\Services\PlanService::can('analytics')) {
            return redirect('/dashboard')
                ->with('warning', 'Los reportes avanzados requieren el plan Trimestral o superior.');
        }

        // Validar fechas — evita queries con valores no controlados
        $request->validate([
            'desde' => 'nullable|date_format:Y-m-d|before_or_equal:today',
            'hasta' => 'nullable|date_format:Y-m-d|before_or_equal:today',
        ]);

        $desde = $request->filled('desde') ? $request->desde : now()->startOfMonth()->format('Y-m-d');
        $hasta = $request->filled('hasta') ? $request->hasta : now()->format('Y-m-d');

        $ventas = Order::whereNotIn('status', ['cancelled'])
            ->whereBetween('created_at', $this->dateRange($desde, $hasta));

        $totalVentas      = (float) $ventas->sum('total');
        $totalPedidos     = $ventas->count();
        $pedidosMesa      = (clone $ventas)->where('type', 'mesa')->count();
        $pedidosDomicilio = (clone $ventas)->where('type', 'domicilio')->count();
        $ticketPromedio   = $totalPedidos > 0 ? round($totalVentas / $totalPedidos, 2) : 0;

        $totalGastos = (float) Gasto::whereBetween('fecha', [$desde, $hasta])->sum('monto');

        $topPlatos = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('dishes', 'dishes.id', '=', 'order_items.dish_id')
            ->whereNotIn('orders.status', ['cancelled'])
            ->whereBetween('orders.created_at', $this->dateRange($desde, $hasta))
            ->groupBy('dishes.id', 'dishes.name')
            ->select('dishes.name', DB::raw('SUM(order_items.quantity) as vendidos'), DB::raw('SUM(order_items.quantity * order_items.unit_price) as ingresos'))
            ->orderByDesc('vendidos')->take(10)->get();

        $ventasPorDia = Order::whereNotIn('status', ['cancelled'])
            ->whereBetween('created_at', $this->dateRange($desde, $hasta))
            ->groupBy('fecha')
            ->select(DB::raw('DATE(created_at) as fecha'), DB::raw('SUM(total) as total'), DB::raw('COUNT(*) as pedidos'))
            ->orderBy('fecha')->get();

        $novedades = KitchenNote::whereBetween('created_at', $this->dateRange($desde, $hasta))
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
                'total_gastos'      => $totalGastos,
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
        // Validación estricta de todos los parámetros de exportación
        $request->validate([
            'tipo'    => 'nullable|string|in:caja,cierre_caja,cierre_datafono,pedidos,cocina,novedades,domicilio,mesa,inventario,gastos',
            'formato' => 'nullable|string|in:xlsx,pdf,pos',
            'desde'   => 'nullable|date_format:Y-m-d|before_or_equal:today',
            'hasta'   => 'nullable|date_format:Y-m-d|before_or_equal:today',
        ]);

        $tipo    = $request->input('tipo', 'pedidos');
        $formato = $request->input('formato', 'xlsx');
        $desde   = $request->input('desde', now()->startOfMonth()->format('Y-m-d'));
        $hasta   = $request->input('hasta', now()->format('Y-m-d'));

        [$titulo, $headers, $rows, $totals] = $this->buildReporte($tipo, $desde, $hasta);

        // Sanitizar filename — previene header injection (solo alfanuméricos, guiones, _)
        $filename = preg_replace('/[^a-z0-9_\-]/', '', "{$tipo}_{$desde}_{$hasta}");

        return match ($formato) {
            'pdf'  => $this->exportPdf($titulo, $headers, $rows, $totals, $desde, $hasta, $filename),
            'pos'  => $this->exportPos($titulo, $headers, $rows, $totals, $desde, $hasta, $filename),
            default => $this->exportXlsx($titulo, $headers, $rows, $totals, $filename),
        };
    }

    // ── Datos por tipo ────────────────────────────────────────────────────────

    private function buildReporte(string $tipo, string $desde, string $hasta): array
    {
        return match ($tipo) {
            'caja'            => $this->reporteCaja($desde, $hasta),
            'cierre_caja'     => $this->reporteCierreCaja($desde, $hasta),
            'cierre_datafono' => $this->reporteCierreDatafono($desde, $hasta),
            'pedidos'         => $this->reportePedidos($desde, $hasta),
            'cocina'          => $this->reporteCocina($desde, $hasta),
            'novedades'       => $this->reporteNovedades($desde, $hasta),
            'domicilio'       => $this->reporteDomicilio($desde, $hasta),
            'mesa'            => $this->reporteMesa($desde, $hasta),   // ← FIX: reporteMesa estaba definida pero nunca se llamaba
            'inventario'      => $this->reporteInventario($desde, $hasta),
            'gastos'          => $this->reporteGastos($desde, $hasta),
            default           => $this->reportePedidos($desde, $hasta),
        };
    }

    private function dateRange(string $desde, string $hasta): array
    {
        return [
            Carbon::createFromFormat('Y-m-d', $desde)->startOfDay(),
            Carbon::createFromFormat('Y-m-d', $hasta)->endOfDay(),
        ];
    }

    private function fmt(float $n): string
    {
        return '$ ' . number_format($n, 0, ',', '.');
    }

    private function tipoLabel(string $type): string
    {
        return match ($type) {
            'mesa'      => 'Mesa',
            'domicilio' => 'Domicilio',
            'mostrador' => 'Mostrador',
            default     => ucfirst($type),
        };
    }

    private function tipoDetalle(Order $o): string
    {
        return match ($o->type) {
            'mesa'      => 'Mesa ' . ($o->table?->number ?? '—'),
            'domicilio' => $o->delivery_address ?? '—',
            'mostrador' => $o->turn_number ? 'Turno #' . $o->turn_number : 'Mostrador',
            default     => ucfirst($o->type),
        };
    }

    // ── 1. Caja ───────────────────────────────────────────────────────────────

    private function reporteCaja(string $desde, string $hasta): array
    {
        $orders = Order::with('table')
            ->where('amount_paid', '>', 0)
            ->whereBetween('created_at', $this->dateRange($desde, $hasta))
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
            $this->tipoLabel($o->type),
            $o->type === 'mostrador' ? ('Turno #' . ($o->turn_number ?? '—')) : ($o->table?->number ?? '—'),
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
            ->whereBetween('created_at', $this->dateRange($desde, $hasta))
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
            $this->tipoLabel($o->type),
            $this->tipoDetalle($o),
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
            ->whereBetween('created_at', $this->dateRange($desde, $hasta))
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
            $this->tipoDetalle($o),
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
            ->whereBetween('created_at', $this->dateRange($desde, $hasta))
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
            ->whereBetween('created_at', $this->dateRange($desde, $hasta))
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
            ->whereBetween('created_at', $this->dateRange($desde, $hasta))
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

    // ── 6. Cierre de Caja ────────────────────────────────────────────────────

    private function reporteCierreCaja(string $desde, string $hasta): array
    {
        $orders = Order::whereBetween(DB::raw('DATE(created_at)'), [$desde, $hasta])
            ->where('status', '!=', 'cancelled')
            ->get();

        $efectivoTotal = (float) $orders
            ->where('payment_method', 'efectivo')
            ->sum(fn($o) => min((float) $o->amount_paid, (float) $o->total));

        $saldados = $orders->filter(fn($o) => (float) $o->amount_paid >= (float) $o->total);

        $resumen = $saldados
            ->whereNotNull('payment_method')
            ->groupBy('payment_method')
            ->map(fn($g, $m) => [$m, $g->count(), (float) $g->sum('total')])
            ->sortByDesc(fn($r) => $r[2])
            ->values();

        $headers = [
            ['label' => 'Método de pago',  'align' => ''],
            ['label' => 'Pedidos saldados', 'align' => 'center'],
            ['label' => 'Total recaudado',  'align' => 'right'],
        ];

        $rows = $resumen->map(fn($r) => [
            ucfirst($r[0]),
            $r[1],
            $this->fmt($r[2]),
        ])->toArray();

        $totals = [
            ['value' => 'TOTAL', 'align' => ''],
            ['value' => $saldados->count() . ' pedidos',    'align' => 'center'],
            ['value' => $this->fmt($saldados->sum('total')), 'align' => 'right'],
        ];

        return ['Cierre de Caja — Resumen por método', $headers, $rows, $totals];
    }

    // ── 7. Cierre de Datáfono ─────────────────────────────────────────────────

    private function reporteCierreDatafono(string $desde, string $hasta): array
    {
        $transacciones = Order::whereBetween(DB::raw('DATE(created_at)'), [$desde, $hasta])
            ->where('status', '!=', 'cancelled')
            ->whereNotNull('payment_method')
            ->where('payment_method', '!=', 'efectivo')
            ->orderBy('payment_method')
            ->orderBy('created_at')
            ->get();

        $headers = [
            ['label' => '#Pedido',  'align' => ''],
            ['label' => 'Cliente',  'align' => ''],
            ['label' => 'Método',   'align' => ''],
            ['label' => 'Monto',    'align' => 'right'],
            ['label' => 'Fecha',    'align' => ''],
        ];

        $rows = $transacciones->map(fn($o) => [
            '#' . $o->id,
            $o->customer_name,
            ucfirst($o->payment_method),
            $this->fmt(min((float) $o->amount_paid, (float) $o->total)),
            $o->created_at->format('d/m/Y H:i'),
        ])->toArray();

        $total = (float) $transacciones->sum(fn($o) => min((float) $o->amount_paid, (float) $o->total));

        $totals = [
            ['value' => 'TOTAL', 'align' => ''],
            ['value' => $transacciones->count() . ' transacciones', 'align' => ''],
            ['value' => '', 'align' => ''],
            ['value' => $this->fmt($total), 'align' => 'right'],
            ['value' => '', 'align' => ''],
        ];

        return ['Cierre de Datáfono — Transacciones electrónicas', $headers, $rows, $totals];
    }

    // ── 8. Gastos ─────────────────────────────────────────────────────────────

    private function reporteGastos(string $desde, string $hasta): array
    {
        $gastos = Gasto::whereBetween('fecha', [$desde, $hasta])
            ->orderBy('fecha')
            ->get();

        $categoriaLabel = [
            'general' => 'General', 'insumos' => 'Insumos', 'servicios' => 'Servicios',
            'nomina' => 'Nómina', 'mantenimiento' => 'Mantenimiento', 'arriendo' => 'Arriendo',
            'transporte' => 'Transporte', 'publicidad' => 'Publicidad', 'equipos' => 'Equipos',
            'otros' => 'Otros',
        ];

        $headers = [
            ['label' => 'Descripción', 'align' => ''],
            ['label' => 'Categoría',   'align' => ''],
            ['label' => 'Fecha',       'align' => ''],
            ['label' => 'Monto',       'align' => 'right'],
            ['label' => 'Notas',       'align' => ''],
        ];

        $rows = $gastos->map(fn($g) => [
            $g->descripcion,
            $categoriaLabel[$g->categoria] ?? ucfirst($g->categoria),
            $g->fecha->format('d/m/Y'),
            $this->fmt((float) $g->monto),
            $g->notas ?? '—',
        ])->toArray();

        $totals = [
            ['value' => 'TOTAL', 'align' => ''],
            ['value' => $gastos->count() . ' gastos', 'align' => ''],
            ['value' => '', 'align' => ''],
            ['value' => $this->fmt((float) $gastos->sum('monto')), 'align' => 'right'],
            ['value' => '', 'align' => ''],
        ];

        return ['Reporte de Gastos', $headers, $rows, $totals];
    }

    // ── 9. Inventario ─────────────────────────────────────────────────────────

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
        $orientation = count($headers) > 6 ? 'landscape' : 'portrait';
        $pdf = Pdf::loadView('exports.reporte', compact('titulo', 'headers', 'rows', 'totals', 'desde', 'hasta'))
            ->setPaper('a4', $orientation)
            ->setOption('defaultFont', 'DejaVu Sans')
            ->setOption('isRemoteEnabled', false)
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('margin_top', 0)
            ->setOption('margin_bottom', 32)
            ->setOption('margin_left', 0)
            ->setOption('margin_right', 0);

        return response($pdf->output(), 200, [
            'Content-Type'              => 'application/pdf',
            'Content-Disposition'       => 'attachment; filename="' . $filename . '.pdf"',
            'X-Content-Type-Options'    => 'nosniff',
            'Cache-Control'             => 'no-store, no-cache, must-revalidate',
            'Pragma'                    => 'no-cache',
        ]);
    }

    // ── Generar POS (80 mm) ───────────────────────────────────────────────────

    private function exportPos(string $titulo, array $headers, array $rows, ?array $totals, string $desde, string $hasta, string $filename)
    {
        // 80 mm = 226.77 pt. Altura generosa para que quepa todo el contenido.
        $heightPt = max(400, 140 + count($rows) * 14 + 60);

        $pdf = Pdf::loadView('exports.reporte_pos', compact('titulo', 'headers', 'rows', 'totals', 'desde', 'hasta'))
            ->setPaper([0, 0, 226.77, $heightPt], 'portrait')
            ->setOption('defaultFont', 'DejaVu Sans Mono')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('margin_top', 0)
            ->setOption('margin_bottom', 0)
            ->setOption('margin_left', 0)
            ->setOption('margin_right', 0);

        return response($pdf->output(), 200, [
            'Content-Type'           => 'application/pdf',
            'Content-Disposition'    => 'attachment; filename="' . $filename . '_pos.pdf"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control'          => 'no-store, no-cache, must-revalidate',
            'Pragma'                 => 'no-cache',
        ]);
    }

    // ── Generar XLSX ──────────────────────────────────────────────────────────

    private function exportXlsx(string $titulo, array $headers, array $rows, ?array $totals, string $filename): \Symfony\Component\HttpFoundation\Response
    {
        $col = fn(int $i) => \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i);
        $n   = count($headers);
        $lastCol = $col($n);

        // ── Colores corporativos ─────────────────────────────────────────────
        $C_NAVY_DARK  = 'FF0F172A'; // header superior y total
        $C_NAVY       = 'FF1E293B'; // cabecera de columnas
        $C_BLUE       = 'FF3B82F6'; // acento
        $C_WHITE      = 'FFFFFFFF';
        $C_GRAY_LIGHT = 'FFF8FAFC'; // fila par
        $C_GRAY_MED   = 'FFF1F5F9'; // meta strip
        $C_BORDER     = 'FFE2E8F0'; // bordes sutiles
        $C_TEXT_DARK  = 'FF1E293B';
        $C_TEXT_MED   = 'FF475569';
        $C_TEXT_SOFT  = 'FF94A3B8';
        $C_ACCENT_TXT = 'FF3B82F6'; // texto acento

        $spreadsheet = new Spreadsheet();
        $sheet       = $spreadsheet->getActiveSheet();
        $sheet->setTitle(mb_substr($titulo, 0, 31));
        $sheet->getTabColor()->setARGB($C_NAVY);
        $sheet->setShowGridlines(false);

        // ── Fila 1: Brand header ─────────────────────────────────────────────
        $sheet->mergeCells("A1:{$lastCol}1");
        $sheet->setCellValue('A1', 'MENUGO  ·  Reporte Oficial');
        $sheet->getStyle('A1')->applyFromArray([
            'font'      => ['name' => 'Calibri', 'bold' => true, 'size' => 9, 'color' => ['argb' => $C_TEXT_SOFT]],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => $C_NAVY_DARK]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'indent' => 2],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(20);

        // ── Fila 2: Título del reporte ───────────────────────────────────────
        $sheet->mergeCells("A2:{$lastCol}2");
        $sheet->setCellValue('A2', $titulo);
        $sheet->getStyle('A2')->applyFromArray([
            'font'      => ['name' => 'Calibri', 'bold' => true, 'size' => 16, 'color' => ['argb' => $C_WHITE]],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => $C_NAVY_DARK]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'indent' => 2],
        ]);
        $sheet->getRowDimension(2)->setRowHeight(34);

        // ── Fila 3: Línea de acento azul ─────────────────────────────────────
        $sheet->mergeCells("A3:{$lastCol}3");
        $sheet->setCellValue('A3', '');
        $sheet->getStyle('A3')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($C_BLUE);
        $sheet->getRowDimension(3)->setRowHeight(3);

        // ── Fila 4: Meta info (período / registros / generado) ───────────────
        $thirds   = (int) ceil($n / 3);
        $thirds2  = $thirds * 2;
        $col1End  = $col(max($thirds, 1));
        $col2Ini  = $col($thirds + 1);
        $col2End  = $col(min($thirds2, $n));
        $col3Ini  = $col(min($thirds2 + 1, $n));

        if ($n >= 3) {
            $sheet->mergeCells("A4:{$col1End}4");
            $sheet->mergeCells("{$col2Ini}4:{$col2End}4");
            $sheet->mergeCells("{$col3Ini}4:{$lastCol}4");
        } else {
            $sheet->mergeCells("A4:{$lastCol}4");
        }

        $sheet->setCellValue('A4', '  Período:  ' . now()->startOfMonth()->format('d/m/Y') . ' — ' . now()->format('d/m/Y'));
        $sheet->setCellValue("{$col2Ini}4", '  Registros:  ' . count($rows));
        $sheet->setCellValue("{$col3Ini}4", '  Generado:  ' . now()->format('d/m/Y  H:i'));

        $sheet->getStyle("A4:{$lastCol}4")->applyFromArray([
            'font'      => ['name' => 'Calibri', 'size' => 9, 'color' => ['argb' => $C_TEXT_MED]],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => $C_GRAY_MED]],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
            'borders'   => ['bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => $C_BORDER]]],
        ]);
        $sheet->getRowDimension(4)->setRowHeight(22);

        // ── Fila 5: Cabecera de columnas ─────────────────────────────────────
        for ($i = 1; $i <= $n; $i++) {
            $sheet->setCellValue($col($i) . '5', mb_strtoupper($headers[$i - 1]['label']));
        }
        $sheet->getStyle("A5:{$lastCol}5")->applyFromArray([
            'font'      => ['name' => 'Calibri', 'bold' => true, 'size' => 8, 'color' => ['argb' => $C_WHITE]],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => $C_NAVY]],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'horizontal' => Alignment::HORIZONTAL_LEFT],
            'borders'   => [
                'bottom' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['argb' => $C_BLUE]],
            ],
        ]);

        // Alineación por columna (cabecera)
        foreach ($headers as $i => $h) {
            $c = $col($i + 1);
            $align = match ($h['align'] ?? '') {
                'right'  => Alignment::HORIZONTAL_RIGHT,
                'center' => Alignment::HORIZONTAL_CENTER,
                default  => Alignment::HORIZONTAL_LEFT,
            };
            $sheet->getStyle("{$c}5")->getAlignment()
                ->setHorizontal($align)
                ->setIndent($align === Alignment::HORIZONTAL_LEFT ? 1 : 0);
        }
        $sheet->getRowDimension(5)->setRowHeight(22);

        // ── Filas de datos ───────────────────────────────────────────────────
        $rowNum = 6;
        foreach ($rows as $row) {
            $isEven = ($rowNum % 2 === 0);
            $bgArgb = $isEven ? $C_GRAY_LIGHT : $C_WHITE;

            for ($i = 1; $i <= $n; $i++) {
                $cell  = $col($i) . $rowNum;
                $value = $row[$i - 1] ?? '';
                $sheet->setCellValue($cell, $value);
            }

            $rowRange = "A{$rowNum}:{$lastCol}{$rowNum}";
            $sheet->getStyle($rowRange)->applyFromArray([
                'font'      => ['name' => 'Calibri', 'size' => 10, 'color' => ['argb' => $C_TEXT_DARK]],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => $bgArgb]],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                'borders'   => [
                    'bottom' => ['borderStyle' => Border::BORDER_HAIR, 'color' => ['argb' => $C_BORDER]],
                ],
            ]);

            // Alineación por columna (datos)
            foreach ($headers as $i => $h) {
                $c = $col($i + 1);
                $align = match ($h['align'] ?? '') {
                    'right'  => Alignment::HORIZONTAL_RIGHT,
                    'center' => Alignment::HORIZONTAL_CENTER,
                    default  => Alignment::HORIZONTAL_LEFT,
                };
                $sheet->getStyle("{$c}{$rowNum}")->getAlignment()
                    ->setHorizontal($align)
                    ->setIndent($align === Alignment::HORIZONTAL_LEFT ? 1 : 0);
            }
            $sheet->getRowDimension($rowNum)->setRowHeight(18);
            $rowNum++;
        }

        // Estado vacío
        if (count($rows) === 0) {
            $sheet->mergeCells("A6:{$lastCol}6");
            $sheet->setCellValue('A6', 'Sin registros en el período seleccionado.');
            $sheet->getStyle('A6')->applyFromArray([
                'font'      => ['name' => 'Calibri', 'italic' => true, 'size' => 10, 'color' => ['argb' => $C_TEXT_SOFT]],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => $C_WHITE]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            ]);
            $sheet->getRowDimension(6)->setRowHeight(36);
            $rowNum = 7;
        }

        // ── Fila de totales ──────────────────────────────────────────────────
        if ($totals) {
            for ($i = 1; $i <= $n; $i++) {
                $cell  = $col($i) . $rowNum;
                $value = $totals[$i - 1]['value'] ?? '';
                $sheet->setCellValue($cell, $value);
            }
            $totalRange = "A{$rowNum}:{$lastCol}{$rowNum}";
            $sheet->getStyle($totalRange)->applyFromArray([
                'font'      => ['name' => 'Calibri', 'bold' => true, 'size' => 10, 'color' => ['argb' => $C_WHITE]],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => $C_NAVY_DARK]],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                'borders'   => [
                    'top' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['argb' => $C_BLUE]],
                ],
            ]);
            foreach ($totals as $i => $t) {
                $c = $col($i + 1);
                $align = match ($t['align'] ?? '') {
                    'right'  => Alignment::HORIZONTAL_RIGHT,
                    'center' => Alignment::HORIZONTAL_CENTER,
                    default  => Alignment::HORIZONTAL_LEFT,
                };
                $sheet->getStyle("{$c}{$rowNum}")->getAlignment()
                    ->setHorizontal($align)
                    ->setIndent($align === Alignment::HORIZONTAL_LEFT ? 1 : 0);
            }
            $sheet->getRowDimension($rowNum)->setRowHeight(22);
        }

        // ── Borde exterior del bloque de datos ───────────────────────────────
        $outerRange = "A5:{$lastCol}" . ($rowNum - ($totals ? 0 : 1));
        $sheet->getStyle($outerRange)->getBorders()->getOutline()
            ->setBorderStyle(Border::BORDER_MEDIUM)->getColor()->setARGB($C_NAVY);

        // ── Anchos de columna ────────────────────────────────────────────────
        // Calcular ancho máximo por columna en base al contenido
        for ($i = 1; $i <= $n; $i++) {
            $maxLen = mb_strlen($headers[$i - 1]['label']) + 4;
            foreach ($rows as $row) {
                $len = mb_strlen((string) ($row[$i - 1] ?? ''));
                if ($len > $maxLen) $maxLen = $len;
            }
            // Limitar entre 10 y 45 caracteres
            $width = min(max($maxLen + 2, 10), 45);
            $sheet->getColumnDimension($col($i))->setWidth($width);
        }

        // ── Congelar filas de cabecera ────────────────────────────────────────
        $sheet->freezePane('A6');

        // ── Márgenes de impresión ─────────────────────────────────────────────
        $sheet->getPageMargins()->setTop(0.5)->setBottom(0.5)->setLeft(0.5)->setRight(0.5);
        $sheet->getPageSetup()
            ->setOrientation(count($headers) > 7
                ? \PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE
                : \PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_PORTRAIT)
            ->setFitToPage(true)
            ->setFitToWidth(1)
            ->setFitToHeight(0);

        $writer  = new Xlsx($spreadsheet);
        $tmpFile = tempnam(sys_get_temp_dir(), 'xlsx_');
        $writer->save($tmpFile);

        return response()->download($tmpFile, "{$filename}.xlsx", [
            'Content-Type'           => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control'          => 'no-store, no-cache, must-revalidate',
            'Pragma'                 => 'no-cache',
        ])->deleteFileAfterSend(true);
    }
}
