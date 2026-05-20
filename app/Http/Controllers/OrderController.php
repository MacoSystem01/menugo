<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
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
            'delivery_address' => $o->delivery_address,
            'delivery_phone'   => $o->delivery_phone,
            'status'           => $o->status,
            'total'            => (float) $o->total,
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

        $tables = \App\Models\RestaurantTable::orderBy('number')->get(['id', 'number']);

        return Inertia::render('Orders', [
            'orders'  => $orders,
            'tables'  => $tables,
            'filters' => $request->only(['status', 'tipo', 'fecha', 'mesa_id']),
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
            'delivery_address' => $o->delivery_address,
            'delivery_phone'   => $o->delivery_phone,
            'status'           => $o->status,
            'total'            => (float) $o->total,
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

        // Pedidos activos: todo lo que no está cerrado, más los entregados sin cobro completo
        $orders = Order::with(['items.dish', 'table'])
            ->where(function ($q) {
                $q->whereNotIn('status', ['delivered', 'cancelled'])
                  ->orWhere(fn($q) => $q->where('status', 'delivered')
                      ->whereColumn('amount_paid', '<', 'total'));
            })
            ->oldest()
            ->get()
            ->map($mapOrder);

        // Historial del día: entregados completamente cobrados + cancelados
        $historial = Order::with(['items.dish', 'table'])
            ->where(function ($q) {
                $q->where(fn($q) => $q->where('status', 'delivered')
                      ->whereColumn('amount_paid', '>=', 'total'))
                  ->orWhere('status', 'cancelled');
            })
            ->whereDate('created_at', today())
            ->latest()
            ->get()
            ->map($mapOrder);

        return Inertia::render('Caja', compact('orders', 'historial'));
    }

    // ── Cierre de Caja: arqueo de efectivo ───────────────────────────────────

    public function cierreCaja()
    {
        $hoy = today();

        $ordenesHoy = Order::with(['table'])
            ->where(function ($q) {
                $q->where(fn($q) => $q->where('status', 'delivered')->whereColumn('amount_paid', '>=', 'total'))
                  ->orWhere('status', 'cancelled');
            })
            ->whereDate('created_at', $hoy)
            ->get();

        // Solo los entregados generan ingresos reales; los cancelados no se cuentan.
        $entregados = $ordenesHoy->where('status', 'delivered');

        $totalSistema   = (float) $entregados->where('payment_method', 'efectivo')->sum('total');
        $resumenMetodos = $entregados
            ->whereNotNull('payment_method')
            ->groupBy('payment_method')
            ->map(fn($g) => [
                'cantidad' => $g->count(),
                'total'    => (float) $g->sum('total'),
            ])
            ->toArray();

        return Inertia::render('Cierre/CierreCaja', [
            'totalSistema'    => $totalSistema,
            'totalOrdenesHoy' => $entregados->count(),
            'resumenMetodos'  => $resumenMetodos,
        ]);
    }

    // ── Cierre de Datafono: reporte de transacciones electrónicas ────────────

    public function cierreDatafono()
    {
        $hoy = today();

        $transacciones = Order::with(['table'])
            ->where(function ($q) {
                $q->where(fn($q) => $q->where('status', 'delivered')->whereColumn('amount_paid', '>=', 'total'))
                  ->orWhere('status', 'cancelled');
            })
            ->whereDate('created_at', $hoy)
            ->whereNotNull('payment_method')
            ->where('payment_method', '!=', 'efectivo')
            ->latest()
            ->get();

        $agrupados = $transacciones
            ->groupBy('payment_method')
            ->map(fn($g, $method) => [
                'method'         => $method,
                'cantidad'       => $g->count(),
                'total'          => (float) $g->sum('amount_paid'),
                'transacciones'  => $g->map(fn($o) => [
                    'id'             => $o->id,
                    'customer_name'  => $o->customer_name,
                    'payment_method' => $o->payment_method,
                    'amount_paid'    => (float) $o->amount_paid,
                    'created_at'     => $o->created_at->format('d/m/Y H:i'),
                ])->values(),
            ])
            ->values();

        return Inertia::render('Cierre/CierreDatafono', [
            'agrupados'    => $agrupados,
            'totalGeneral' => (float) $transacciones->sum('amount_paid'),
            'fecha'        => $hoy->format('d/m/Y'),
        ]);
    }

    // ── Cobrar: registra pago completo y envía a cocina ───────────────────────

    public function cobrar(Request $request, Order $order)
    {
        $order->update([
            'status'      => 'in_kitchen',
            'cashier_id'  => auth()->user()?->id,
            'amount_paid' => $order->total,
        ]);

        AuditLog::registrar('payment', 'Pedido', $order->id, "Pedido #{$order->id} en Mesa #" . ($order->table?->number ?? '—') . " cobrado (total: \${$order->total})", [
            'amount'   => (float) $order->total,
            'method'   => $order->payment_method ?? 'efectivo',
            'table_id' => $order->table_id,
        ]);

        return redirect('/caja')->with('success', "Pedido #{$order->id} cobrado y enviado a cocina.");
    }

    // ── Registrar Pago: registra monto parcial o completo ────────────────────

    public function registrarPago(Request $request, Order $order)
    {
        $request->validate([
            'amount_paid'    => 'required|numeric|min:0.01|max:9999999',
            'payment_method' => 'nullable|string|in:efectivo,pse,nequi,daviplata,tarjeta,transferencia',
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
