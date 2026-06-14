<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\CartaSetting;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderController extends Controller
{
    // ── Vista Pedidos (historial general) ─────────────────────────────────────

    public function index(Request $request)
    {
        $query = Order::with(['items.dish', 'table'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('tipo')) {
            $query->where('type', $request->tipo);
        }

        if ($request->filled('fecha')) {
            $query->whereDate('created_at', $request->fecha);
        }

        if ($request->filled('mesa_id')) {
            $query->where('table_id', $request->mesa_id);
        }

        $orders = $query->paginate(25)->through(fn($o) => [
            'id'               => $o->id,
            'customer_name'    => $o->customer_name,
            'customer_phone'   => $o->customer_phone,
            'tipo'             => $o->type,
            'mesa'             => $o->table?->number,
            'turn_number'      => $o->turn_number,
            'delivery_address' => $o->delivery_address,
            'delivery_phone'   => $o->delivery_phone,
            'status'           => $o->status,
            'total'            => (float) $o->total,
            'delivery_fee'     => (float) ($o->delivery_fee ?? 0),
            'amount_paid'      => (float) $o->amount_paid,
            'payment_method'   => $o->payment_method,
            'notas'            => $o->notes,
            'items'            => $o->items->map(fn($i) => [
                'dish'        => $i->dish?->name,
                'quantity'    => $i->quantity,
                'unit_price'  => (float) $i->unit_price,
                'notes'       => $i->notes,
                'is_addition' => (bool) ($i->is_addition ?? false),
            ]),
            'created_at'       => $o->created_at->format('d/m/Y H:i'),
        ]);

        $tables         = \App\Models\RestaurantTable::orderBy('number')->get(['id', 'number']);
        $deliveryZones  = CartaSetting::firstOrCreate([])->delivery_zones ?? [];

        return Inertia::render('Orders', [
            'orders'         => $orders,
            'tables'         => $tables,
            'filters'        => $request->only(['status', 'tipo', 'fecha', 'mesa_id']),
            'delivery_zones' => $deliveryZones,
        ]);
    }

    // ── Vista Caja (todas las cuentas activas) ────────────────────────────────

    public function caja()
    {
        $mapOrder = fn($o) => [
            'id'               => $o->id,
            'customer_name'    => $o->customer_name,
            'customer_phone'   => $o->customer_phone,
            'tipo'             => $o->type,
            'table_id'         => $o->table_id,
            'mesa'             => $o->table?->number,
            'turn_number'      => $o->turn_number,
            'delivery_address' => $o->delivery_address,
            'delivery_phone'   => $o->delivery_phone,
            'status'           => $o->status,
            'total'            => (float) $o->total,
            'delivery_fee'     => (float) ($o->delivery_fee ?? 0),
            'amount_paid'      => (float) $o->amount_paid,
            'payment_method'   => $o->payment_method,
            'notes'            => $o->notes,
            'items'            => $o->items->map(fn($i) => [
                'dish'        => $i->dish?->name,
                'quantity'    => $i->quantity,
                'unit_price'  => (float) $i->unit_price,
                'notes'       => $i->notes,
                'is_addition' => (bool) $i->is_addition,
            ]),
            'created_at'       => $o->created_at->format('d/m/Y H:i'),
            'delivered_at'     => $o->delivered_at?->format('d/m/Y H:i'),
        ];

        // Pedidos activos: jornada actual (no EOD), excluye delivered/cancelled salvo unpaid delivered
        $orders = Order::with(['items.dish', 'table'])
            ->whereNull('closed_at_eod')
            ->where(function ($q) {
                $q->whereNotIn('status', ['delivered', 'cancelled'])
                    ->orWhere(fn($q) => $q->where('status', 'delivered')
                        ->whereColumn('amount_paid', '<', 'total'));
            })
            ->oldest()
            ->get()
            ->map($mapOrder);

        // Historial del día: entregados completamente cobrados + cancelados (jornada actual)
        $historial = Order::with(['items.dish', 'table'])
            ->whereNull('closed_at_eod')
            ->where(function ($q) {
                $q->where(fn($q) => $q->where('status', 'delivered')
                    ->whereColumn('amount_paid', '>=', 'total'))
                    ->orWhere('status', 'cancelled');
            })
            ->whereDate('created_at', today())
            ->latest()
            ->get()
            ->map($mapOrder);

        $cfg = \App\Models\CartaSetting::firstOrCreate([]);

        // Detect if EOD close is due
        $needsEod = false;
        $schedule = $cfg->work_schedule ?? [];
        $dayMap   = ['Sun' => 'dom', 'Mon' => 'lun', 'Tue' => 'mar', 'Wed' => 'mie', 'Thu' => 'jue', 'Fri' => 'vie', 'Sat' => 'sab'];
        $todayKey = $dayMap[now()->format('D')] ?? null;
        $todaySchedule = $todayKey ? ($schedule[$todayKey] ?? null) : null;

        if ($todaySchedule && ($todaySchedule['activo'] ?? false) && isset($todaySchedule['cierre'])) {
            $closingTime = \Carbon\Carbon::createFromFormat('H:i', $todaySchedule['cierre'])->setDateFrom(today());
            $lastClosing = \App\Models\DailyClosing::whereDate('closed_at', today())->exists();

            if (now()->gte($closingTime) && ! $lastClosing) {
                $needsEod = true;
            }
        }

        return Inertia::render('Caja', [
            'orders'          => $orders,
            'historial'       => $historial,
            'paymentMethods'  => $cfg->payment_methods  ?? ['efectivo'],
            'paymentDetails'  => $cfg->payment_details  ?? [],
            'delivery_zones'  => $cfg->delivery_zones   ?? [],
            'needs_eod'       => $needsEod,
            'closing_time'    => $todaySchedule['cierre'] ?? null,
        ]);
    }

    // ── Asignar tarifa de domicilio ───────────────────────────────────────────

    public function asignarTarifaDomicilio(Request $request, Order $order)
    {
        $data = $request->validate([
            'delivery_fee' => 'required|integer|min:0',
        ]);

        $order->delivery_fee = $data['delivery_fee'];
        $order->recalculateTotal();

        AuditLog::registrar('update', 'Order', $order->id,
            'Tarifa de domicilio asignada: $' . number_format($data['delivery_fee'], 0, ',', '.'),
            ['delivery_fee' => $data['delivery_fee'], 'total_nuevo' => (float) $order->total]
        );

        return back()->with('success', 'Tarifa de domicilio asignada.');
    }

    // ── Cierre de Caja: arqueo de efectivo ───────────────────────────────────

    public function cierreCaja()
    {
        $hoy = today();

        // Todos los pedidos del día no cancelados (igual que "Pago Efectivo" en /caja)
        $pedidosHoy = Order::whereDate('created_at', $hoy)
            ->where('status', '!=', 'cancelled')
            ->get();

        // Efectivo: suma de min(amount_paid, total) para pedidos con método efectivo
        $totalSistema = (float) $pedidosHoy
            ->where('payment_method', 'efectivo')
            ->sum(fn($o) => min((float) $o->amount_paid, (float) $o->total));

        // Resumen por método: solo pedidos saldados (amount_paid >= total)
        $saldados = $pedidosHoy->filter(fn($o) => (float) $o->amount_paid >= (float) $o->total);

        $resumenMetodos = $saldados
            ->whereNotNull('payment_method')
            ->groupBy('payment_method')
            ->map(fn($g) => [
                'cantidad' => $g->count(),
                'total'    => (float) $g->sum('total'),
            ])
            ->toArray();

        return Inertia::render('Cierre/CierreCaja', [
            'totalSistema'    => $totalSistema,
            'totalOrdenesHoy' => $saldados->count(),
            'resumenMetodos'  => $resumenMetodos,
        ]);
    }

    // ── Cierre de Datafono: reporte de transacciones electrónicas ────────────

    public function cierreDatafono()
    {
        $hoy = today();

        // Todos los pedidos del día no cancelados con método electrónico (igual que "Pago Efectivo" en /caja)
        $transacciones = Order::whereDate('created_at', $hoy)
            ->where('status', '!=', 'cancelled')
            ->whereNotNull('payment_method')
            ->where('payment_method', '!=', 'efectivo')
            ->latest()
            ->get();

        $agrupados = $transacciones
            ->groupBy('payment_method')
            ->map(fn($g, $method) => [
                'method'        => $method,
                'cantidad'      => $g->count(),
                'total'         => (float) $g->sum(fn($o) => min((float) $o->amount_paid, (float) $o->total)),
                'transacciones' => $g->map(fn($o) => [
                    'id'             => $o->id,
                    'customer_name'  => $o->customer_name,
                    'payment_method' => $o->payment_method,
                    'amount_paid'    => (float) min((float) $o->amount_paid, (float) $o->total),
                    'created_at'     => $o->created_at->format('d/m/Y H:i'),
                ])->values(),
            ])
            ->values();

        $totalGeneral = (float) $transacciones->sum(fn($o) => min((float) $o->amount_paid, (float) $o->total));

        return Inertia::render('Cierre/CierreDatafono', [
            'agrupados'    => $agrupados,
            'totalGeneral' => $totalGeneral,
            'fecha'        => $hoy->format('d/m/Y'),
        ]);
    }

    // ── Cobrar: registra pago completo y envía a cocina ───────────────────────

    public function cobrar(Request $request, Order $order)
    {
        $update = [
            'cashier_id'  => auth()->user()?->id,
            'amount_paid' => $order->total,
        ];

        // Solo avanzar a in_kitchen si aún no ha pasado por cocina; evita
        // regresar el estado cuando el pedido ya está en cooking, ready, etc.
        if ($order->status === 'pending') {
            $update['status'] = 'in_kitchen';
        }

        $order->update($update);

        AuditLog::registrar('payment', 'Pedido', $order->id, "Pedido #{$order->id} en Mesa #" . ($order->table?->number ?? '—') . " cobrado (total: \${$order->total})", [
            'amount'   => (float) $order->total,
            'method'   => $order->payment_method ?? 'efectivo',
            'table_id' => $order->table_id,
        ]);

        return redirect('/caja')->with('success', "Pedido #{$order->id} cobrado.");
    }

    // ── Registrar Pago: registra monto parcial o completo ────────────────────

    public function registrarPago(Request $request, Order $order)
    {
        // Obtener métodos de pago dinámicamente desde la configuración del tenant
        $allowedMethods = collect(\App\Models\CartaSetting::firstOrCreate([])->payment_methods ?? [])
            ->merge(['efectivo']) // efectivo siempre disponible
            ->unique()
            ->values()
            ->toArray();

        $request->validate([
            'amount_paid'    => 'required|numeric|min:0.01|max:9999999',
            'payment_method' => ['nullable', 'string', \Illuminate\Validation\Rule::in($allowedMethods)],
        ]);

        if ($order->status === 'cancelled') {
            return back()->withErrors(['error' => 'No se puede registrar pago en un pedido cancelado.']);
        }

        $newAmount = round((float) $order->amount_paid + (float) $request->amount_paid, 2);

        $order->update([
            'amount_paid'    => $newAmount,
            'payment_method' => $request->payment_method ?? $order->payment_method,
            'cashier_id'     => auth()->user()?->id,
        ]);

        $paid    = $newAmount >= $order->total;
        $message = $paid
            ? "Pago completo registrado para pedido #{$order->id}."
            : "Pago parcial registrado para pedido #{$order->id}.";

        AuditLog::registrar('payment', 'Pedido', $order->id, $message, [
            'amount_paid'    => (float) $request->amount_paid,
            'total'          => (float) $order->total,
            'payment_method' => $request->payment_method ?? $order->payment_method,
            'table_id'       => $order->table_id,
        ]);

        return redirect('/caja')->with('success', $message);
    }

    // ── Cancelar pedido ───────────────────────────────────────────────────────

    public function cancelar(Order $order)
    {
        if (in_array($order->status, ['delivered', 'cancelled'])) {
            return back()->withErrors(['error' => 'Este pedido no se puede cancelar.']);
        }

        $prevStatus = $order->status;
        $order->update(['status' => 'cancelled']);

        AuditLog::registrar('cancel', 'Pedido', $order->id, "Pedido #{$order->id} cancelado", [
            'prev_status' => $prevStatus,
            'table_id'    => $order->table_id,
        ]);

        return back()->with('success', "Pedido #{$order->id} cancelado.");
    }
}
