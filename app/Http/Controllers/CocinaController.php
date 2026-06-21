<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Dish;
use App\Models\KitchenNote;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CocinaController extends Controller
{
    // ── Vista principal de cocina (KDS) ───────────────────────────────────────

    public function index()
    {
        // Para Restaurante la cocina siempre ve todos los estados (incluido pending).
        // Para Puesto de Comidas Rápidas el flujo es configurable:
        //   pago_primero  → cocina solo ve in_kitchen+ (pending queda en /caja hasta cobrar)
        //   cocina_primero → cocina ve pending desde que llega el pedido; pago al final
        $isPuesto  = tenant('type') === 'puesto';
        $orderFlow = $isPuesto
            ? (\App\Models\CartaSetting::firstOrCreate([])->order_flow ?? 'pago_primero')
            : 'cocina_primero';

        $statuses = ($isPuesto && $orderFlow === 'pago_primero')
            ? ['in_kitchen', 'cooking', 'ready']
            : ['pending', 'in_kitchen', 'cooking', 'ready'];

        $orders = Order::with(['items.dish', 'table'])
            ->whereIn('status', $statuses)
            ->oldest()
            ->get()
            ->map(function ($o) {
                // Solo los ítems que aún no han sido cocinados/entregados.
                // is_cooked se marca true en markDelivered(), de modo que adiciones
                // posteriores arrancan con is_cooked = false y nunca se repiten.
                $itemsParaCocina = $o->items->where('is_cooked', false)->values();

                // Es una adición si el pedido ya tiene ítems cocinados anteriormente.
                $esAdicion = $o->items->where('is_cooked', true)->isNotEmpty();

                return [
                    'id'             => $o->id,
                    'customer_name'  => $o->customer_name,
                    'tipo'           => $o->type,
                    'turno'          => $o->turn_number,
                    'mesa'           => $o->table?->number,
                    'status'         => $o->status,
                    'notas'          => $o->notes,
                    'payment_method' => $o->payment_method,
                    'es_adicion'     => $esAdicion,
                    'items'          => $itemsParaCocina->map(fn($i) => [
                        'id'          => $i->id,
                        'dish'        => $i->dish?->name,
                        'quantity'    => $i->quantity,
                        'notes'       => $i->notes,
                        'is_addition' => (bool) $i->is_addition,
                        'is_prepared' => (bool) $i->is_prepared,
                    ]),
                    'tiempo'         => $o->created_at->diffForHumans(short: true),
                    'created_at'     => $o->created_at->format('H:i'),
                ];
            });

        // Pedidos entregados en los últimos 15 minutos
        $recientes = Order::with(['items.dish', 'table'])
            ->where('status', 'delivered')
            ->where('delivered_at', '>=', now()->subMinutes(15))
            ->latest('delivered_at')
            ->get()
            ->map(fn($o) => [
                'id'         => $o->id,
                'tipo'       => $o->type,
                'turno'      => $o->turn_number,
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

    // ── Marcar listo: cooking → ready (restaurante) | pending → ready (mostrador) ─

    public function markReady(Order $order)
    {
        $isMostrador = $order->type === 'mostrador';
        $validFrom   = $isMostrador ? ['pending'] : ['cooking'];

        if (!in_array($order->status, $validFrom)) {
            return back()->withErrors(['error' => 'Estado incorrecto.']);
        }

        // Para restaurante: todos los ítems deben estar marcados como preparados
        if (!$isMostrador) {
            $pendingItems = $order->items()->where('is_prepared', false)->count();

            if ($pendingItems > 0) {
                return back()->withErrors([
                    'error' => "Faltan {$pendingItems} ítem(s) por marcar como preparado(s).",
                ]);
            }
        }

        $fromStatus = $order->status;
        $order->update(['status' => 'ready', 'ready_at' => now()]);

        AuditLog::registrar('status', 'Pedido', $order->id, "Pedido #{$order->id} listo para entregar", [
            'from' => $fromStatus, 'to' => 'ready',
        ]);

        return back();
    }

    // ── Marcar ítem como preparado (toggle desde el KDS) ─────────────────────

    public function marcarItemPreparado(Request $request, int $item)
    {
        $orderItem = OrderItem::find($item);
        if (!$orderItem) {
            return back()->with('warning', 'El ítem no fue encontrado. El pedido puede haber sido actualizado.');
        }
        $orderItem->update(['is_prepared' => $request->boolean('is_prepared', true)]);
        return back();
    }

    // ── Marcar entregado: ready → delivered ───────────────────────────────────

    public function markDelivered(Request $request, Order $order)
    {
        if ($order->status !== 'ready') {
            $to = in_array($request->input('redirect_to'), ['tables', 'cocina'])
                ? $request->input('redirect_to') : 'cocina';
            return redirect('/' . $to)->withErrors(['error' => 'Estado incorrecto.']);
        }

        $to = in_array($request->input('redirect_to'), ['tables', 'cocina'])
            ? $request->input('redirect_to') : 'cocina';

        // Para mostrador (puesto): cerrar directamente — no hay paso de preparación por ítem
        if ($order->type === 'mostrador') {
            $order->items()->update(['is_cooked' => true, 'is_prepared' => true]);
            $order->update(['status' => 'delivered', 'delivered_at' => now()]);

            AuditLog::registrar('status', 'Pedido', $order->id, "Pedido #{$order->id} entregado", [
                'from' => 'ready', 'to' => 'delivered',
            ]);

            return redirect('/' . $to);
        }

        // Flujo restaurante: solo se marcan cocinados los ítems que el cocinero confirmó.
        $order->items()->where('is_cooked', false)->where('is_prepared', true)->update(['is_cooked' => true]);

        // Si quedaron ítems sin preparar, reabrir el pedido para que vuelvan a cocina.
        $pendingItems = $order->items()->where('is_cooked', false)->where('is_prepared', false)->count();

        if ($pendingItems > 0) {
            $order->update(['status' => 'pending']);

            AuditLog::registrar('status', 'Pedido', $order->id, "Pedido #{$order->id} entregado parcialmente — {$pendingItems} ítem(s) pendiente(s)", [
                'from' => 'ready', 'to' => 'pending',
            ]);

            return redirect('/' . $to)->with('warning', "Pedido #{$order->id} entregado parcialmente. Quedan {$pendingItems} producto(s) por preparar en cocina.");
        }

        $order->update(['status' => 'delivered', 'delivered_at' => now()]);

        AuditLog::registrar('status', 'Pedido', $order->id, "Pedido #{$order->id} entregado", [
            'from' => 'ready', 'to' => 'delivered',
        ]);

        return redirect('/' . $to);
    }

    // ── Cancelar pedido desde cocina ─────────────────────────────────────────

    public function cancelarPedido(Order $order)
    {
        if (in_array($order->status, ['delivered', 'cancelled'])) {
            return back()->withErrors(['error' => 'Este pedido no se puede cancelar.']);
        }

        $prevStatus = $order->status;
        $order->update(['status' => 'cancelled']);

        // Registro automático de novedad en cocina
        KitchenNote::create([
            'type'        => 'cancelado',
            'description' => "Pedido #{$order->id} cancelado desde cocina (estado previo: {$prevStatus})",
            'order_id'    => $order->id,
            'created_by'  => auth()->id(),
        ]);

        AuditLog::registrar('cancel', 'Pedido', $order->id, "Pedido #{$order->id} cancelado desde cocina", [
            'prev_status' => $prevStatus,
            'table_id'    => $order->table_id,
        ]);

        return back()->with('warning', "Pedido #{$order->turn_number} cancelado. Registrado en novedades de cocina.");
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
                'order_turn_number' => $n->order?->turn_number,
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
            ->get(['id', 'turn_number', 'customer_name']);

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

        $note = KitchenNote::create([
            ...$data,
            'created_by' => auth()->id(),
        ]);

        AuditLog::registrar('create', 'Novedad', $note->id, "Novedad tipo '{$note->type}' registrada manualmente", [
            'type'        => $note->type,
            'description' => $note->description,
            'order_id'    => $note->order_id,
        ]);

        return back()->with('success', 'Novedad registrada.');
    }
}
