<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Dish;
use App\Models\KitchenNote;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CocinaController extends Controller
{
    // ── Vista principal de cocina (KDS) ───────────────────────────────────────

    public function index()
    {
        // Pedidos activos en cocina (pending = recién llegados, in_kitchen, cooking, ready)
        $orders = Order::with(['items.dish', 'table'])
            ->whereIn('status', ['pending', 'in_kitchen', 'cooking', 'ready'])
            ->oldest()
            ->get()
            ->map(fn($o) => [
                'id'             => $o->id,
                'customer_name'  => $o->customer_name,
                'customer_phone' => $o->customer_phone,
                'tipo'           => $o->type,
                'mesa'           => $o->table?->number,
                'status'         => $o->status,
                'notas'          => $o->notes,
                'payment_method' => $o->payment_method,
                'items'          => $o->items->map(fn($i) => [
                    'dish'     => $i->dish?->name,
                    'quantity' => $i->quantity,
                    'notes'    => $i->notes,
                ]),
                'tiempo'         => $o->created_at->diffForHumans(short: true),
                'created_at'     => $o->created_at->format('H:i'),
            ]);

        // Pedidos entregados en los últimos 15 minutos
        $recientes = Order::with(['items.dish', 'table'])
            ->where('status', 'delivered')
            ->where('delivered_at', '>=', now()->subMinutes(15))
            ->latest('delivered_at')
            ->get()
            ->map(fn($o) => [
                'id'         => $o->id,
                'tipo'       => $o->type,
                'mesa'       => $o->table?->number,
                'items_count'=> $o->items->count(),
                'entregado'  => $o->delivered_at?->diffForHumans(short: true),
            ]);

        return Inertia::render('Cocina', compact('orders', 'recientes'));
    }

    // ── Aceptar pedido entrante: pending → in_kitchen ────────────────────────

    public function acceptOrder(Order $order)
    {
        if ($order->status !== 'pending') {
            return back()->withErrors(['error' => 'Estado incorrecto.']);
        }

        $order->update(['status' => 'in_kitchen']);

        AuditLog::registrar('status', 'Pedido', $order->id, "Pedido #{$order->id} aceptado en cocina", [
            'from' => 'pending', 'to' => 'in_kitchen',
        ]);

        return back();
    }

    // ── Iniciar cocción: in_kitchen → cooking ─────────────────────────────────

    public function startCooking(Order $order)
    {
        if ($order->status !== 'in_kitchen') {
            return back()->withErrors(['error' => 'Estado incorrecto.']);
        }

        $order->update([
            'status'  => 'cooking',
            'cook_id' => auth()->id(),
        ]);

        AuditLog::registrar('status', 'Pedido', $order->id, "Pedido #{$order->id} en cocción", [
            'from' => 'in_kitchen', 'to' => 'cooking',
        ]);

        return back();
    }

    // ── Marcar listo: cooking → ready ─────────────────────────────────────────

    public function markReady(Order $order)
    {
        if ($order->status !== 'cooking') {
            return back()->withErrors(['error' => 'Estado incorrecto.']);
        }

        $order->update(['status' => 'ready', 'ready_at' => now()]);

        AuditLog::registrar('status', 'Pedido', $order->id, "Pedido #{$order->id} listo para entregar", [
            'from' => 'cooking', 'to' => 'ready',
        ]);

        return back();
    }

    // ── Marcar entregado: ready → delivered ───────────────────────────────────

    public function markDelivered(Order $order)
    {
        if ($order->status !== 'ready') {
            return back()->withErrors(['error' => 'Estado incorrecto.']);
        }

        $order->update(['status' => 'delivered', 'delivered_at' => now()]);

        AuditLog::registrar('status', 'Pedido', $order->id, "Pedido #{$order->id} entregado", [
            'from' => 'ready', 'to' => 'delivered',
        ]);

        return back();
    }

    // ── Novedades ─────────────────────────────────────────────────────────────

    public function novedades()
    {
        $notes = KitchenNote::with(['order', 'dish', 'author', 'verifiedBy'])
            ->latest()
            ->take(100)
            ->get()
            ->map(fn($n) => [
                'id'          => $n->id,
                'type'        => $n->type,
                'description' => $n->description,
                'order_id'    => $n->order_id,
                'dish'        => $n->dish?->name,
                'author'      => $n->author?->name,
                'created_at'  => $n->created_at->format('d/m/Y H:i'),
                'verified_at' => $n->verified_at?->format('d/m/Y H:i'),
                'verified_by' => $n->verifiedBy?->name,
            ]);

        // Platos activos para el selector del formulario
        $dishes = Dish::where('available', true)->orderBy('name')->get(['id', 'name']);

        // Últimos pedidos activos para poder asociar la novedad
        $orders = Order::whereIn('status', ['in_kitchen', 'cooking', 'ready'])
            ->orderByDesc('id')
            ->take(20)
            ->get(['id', 'customer_name']);

        return Inertia::render('KitchenNotes', compact('notes', 'dishes', 'orders'));
    }

    public function verificarNovedad(KitchenNote $note)
    {
        if ($note->verified_at) {
            return back()->withErrors(['error' => 'Esta novedad ya fue verificada.']);
        }

        $note->update([
            'verified_at' => now(),
            'verified_by' => auth()->user()?->id,
        ]);

        AuditLog::registrar('verify', 'Novedad', $note->id, "Novedad #{$note->id} verificada ({$note->type})");

        return back()->with('success', "Novedad #{$note->id} verificada.");
    }

    public function storeNovedad(Request $request)
    {
        $data = $request->validate([
            'type'        => 'required|in:quemado,cancelado,devuelto,dañado,otro',
            'description' => 'required|string|max:500',
            'order_id'    => 'nullable|exists:orders,id',
            'dish_id'     => 'nullable|exists:dishes,id',
        ]);

        KitchenNote::create([
            ...$data,
            'created_by' => auth()->id(),
        ]);

        return back()->with('success', 'Novedad registrada.');
    }
}
