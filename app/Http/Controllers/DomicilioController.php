<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DomicilioController extends Controller
{
    public function index()
    {
        // Pedidos de domicilio activos (listos para despachar o en camino)
        $active = Order::with(['items.dish', 'deliveryUser'])
            ->where('type', 'domicilio')
            ->whereIn('status', ['ready', 'delivered'])
            ->latest()
            ->get()
            ->map(fn($o) => [
                'id'               => $o->id,
                'customer_name'    => $o->customer_name,
                'customer_phone'   => $o->customer_phone,
                'delivery_address' => $o->delivery_address,
                'delivery_phone'   => $o->delivery_phone,
                'status'           => $o->status,
                'total'            => (float) $o->total,
                'delivery_user'    => $o->deliveryUser?->name,
                'delivery_user_id' => $o->delivery_user_id,
                'items_count'      => $o->items->count(),
                'notas'            => $o->notes,
                'created_at'       => $o->created_at->format('H:i'),
                'delivered_at'     => $o->delivered_at?->format('H:i'),
            ]);

        // Personal de domicilio disponible
        $repartidores = User::role('domicilio')
            ->where('active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Domicilio', compact('active', 'repartidores'));
    }

    // ── Asignar repartidor ────────────────────────────────────────────────────

    public function asignar(Request $request, Order $order)
    {
        $data = $request->validate([
            'delivery_user_id' => 'required|exists:users,id',
        ]);

        $repartidor = User::find($data['delivery_user_id']);
        $order->update(['delivery_user_id' => $data['delivery_user_id']]);

        AuditLog::registrar('assign', 'Pedido', $order->id, "Repartidor '{$repartidor?->name}' asignado al pedido #{$order->id}", [
            'delivery_user_id' => $data['delivery_user_id'],
        ]);

        return back()->with('success', 'Repartidor asignado.');
    }

    // ── Tomar pedido: el repartidor se autoasigna ─────────────────────────────

    public function tomar(Order $order)
    {
        if ($order->type !== 'domicilio' || $order->status !== 'ready') {
            return back()->withErrors(['error' => 'El pedido no está disponible para entrega.']);
        }

        if ($order->delivery_user_id && $order->delivery_user_id !== auth()->user()?->id) {
            return back()->withErrors(['error' => 'Este pedido ya tiene un repartidor asignado.']);
        }

        $order->update(['delivery_user_id' => auth()->user()?->id]);

        AuditLog::registrar('assign', 'Pedido', $order->id, "Pedido #{$order->id} tomado por " . auth()->user()->name);

        return back()->with('success', "Has tomado el pedido #{$order->id}.");
    }

    // ── Alerta JSON: domicilios listos sin repartidor ─────────────────────────

    public function alertas()
    {
        $orders = Order::where('type', 'domicilio')
            ->where('status', 'ready')
            ->whereNull('delivery_user_id')
            ->whereNull('closed_at_eod')
            ->latest()
            ->get(['id', 'customer_name', 'delivery_address', 'ready_at'])
            ->map(fn($o) => [
                'id'               => $o->id,
                'customer_name'    => $o->customer_name,
                'delivery_address' => $o->delivery_address,
                'ready_at'         => $o->ready_at?->format('H:i'),
            ]);

        return response()->json([
            'count'  => $orders->count(),
            'orders' => $orders->values(),
        ]);
    }

    // ── Marcar como entregado ─────────────────────────────────────────────────

    public function entregar(Order $order)
    {
        if ($order->type !== 'domicilio' || $order->status !== 'ready') {
            return back()->withErrors(['error' => 'El pedido no está en estado correcto.']);
        }

        $order->update(['status' => 'delivered', 'delivered_at' => now()]);

        AuditLog::registrar('status', 'Pedido', $order->id, "Domicilio #{$order->id} entregado", [
            'from' => 'ready', 'to' => 'delivered',
        ]);

        return back()->with('success', "Pedido #{$order->id} marcado como entregado.");
    }
}
