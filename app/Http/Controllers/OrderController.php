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

        $orders = $query->paginate(25)->through(fn($o) => [
            'id'              => $o->id,
            'customer_name'   => $o->customer_name,
            'customer_phone'  => $o->customer_phone,
            'tipo'            => $o->type,
            'mesa'            => $o->table?->number,
            'delivery_address'=> $o->delivery_address,
            'status'          => $o->status,
            'total'           => (float) $o->total,
            'notas'           => $o->notes,
            'items'           => $o->items->map(fn($i) => [
                'dish'       => $i->dish?->name,
                'quantity'   => $i->quantity,
                'unit_price' => (float) $i->unit_price,
                'notes'      => $i->notes,
            ]),
            'created_at'      => $o->created_at->format('d/m/Y H:i'),
        ]);

        return Inertia::render('Orders', [
            'orders'  => $orders,
            'filters' => $request->only(['status', 'tipo', 'fecha']),
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
            'mesa'             => $o->table?->number,
            'delivery_address' => $o->delivery_address,
            'status'           => $o->status,
            'total'            => (float) $o->total,
            'amount_paid'      => (float) $o->amount_paid,
            'payment_method'   => $o->payment_method,
            'items'            => $o->items->map(fn($i) => [
                'dish'       => $i->dish?->name,
                'quantity'   => $i->quantity,
                'unit_price' => (float) $i->unit_price,
            ]),
            'created_at'       => $o->created_at->format('H:i'),
        ];

        // Cuentas activas (en proceso)
        $orders = Order::with(['items.dish', 'table'])
            ->whereNotIn('status', ['delivered', 'cancelled'])
            ->oldest()
            ->get()
            ->map($mapOrder);

        // Cobros del día (entregados o cancelados con pago registrado hoy)
        $historial = Order::with(['items.dish', 'table'])
            ->whereIn('status', ['delivered', 'cancelled'])
            ->whereDate('created_at', today())
            ->where('amount_paid', '>', 0)
            ->latest()
            ->get()
            ->map($mapOrder);

        return Inertia::render('Caja', compact('orders', 'historial'));
    }

    // ── Cobrar: registra pago completo y envía a cocina ───────────────────────

    public function cobrar(Request $request, Order $order)
    {
        $order->update([
            'status'      => 'in_kitchen',
            'cashier_id'  => auth()->user()?->id,
            'amount_paid' => $order->total,
        ]);

        AuditLog::registrar('payment', 'Pedido', $order->id, "Pedido #{$order->id} cobrado (total: \${$order->total})", [
            'amount' => (float) $order->total,
            'method' => $order->payment_method ?? 'efectivo',
        ]);

        return back()->with('success', "Pedido #{$order->id} cobrado y enviado a cocina.");
    }

    // ── Registrar Pago: registra monto parcial o completo ────────────────────

    public function registrarPago(Request $request, Order $order)
    {
        $request->validate([
            'amount_paid'    => 'required|numeric|min:0',
            'payment_method' => 'nullable|string|max:50',
        ]);

        $order->update([
            'amount_paid'    => $request->amount_paid,
            'payment_method' => $request->payment_method ?? $order->payment_method,
            'cashier_id'     => auth()->user()?->id,
        ]);

        $paid    = $request->amount_paid >= $order->total;
        $message = $paid
            ? "Pago completo registrado para pedido #{$order->id}."
            : "Pago parcial registrado para pedido #{$order->id}.";

        AuditLog::registrar('payment', 'Pedido', $order->id, $message, [
            'amount_paid'    => (float) $request->amount_paid,
            'total'          => (float) $order->total,
            'payment_method' => $request->payment_method ?? $order->payment_method,
        ]);

        return back()->with('success', $message);
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
        ]);

        return back()->with('success', "Pedido #{$order->id} cancelado.");
    }
}
