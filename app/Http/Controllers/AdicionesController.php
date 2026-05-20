<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Dish;
use App\Models\Order;
use App\Models\RestaurantTable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdicionesController extends Controller
{
    public function index()
    {
        // All tables that had any order today (active or closed)
        $tables = RestaurantTable::with([
            'orders' => fn($q) => $q->whereDate('created_at', today())->orderBy('created_at'),
            'orders.items.dish',
        ])
            ->whereHas('orders', fn($q) => $q->whereDate('created_at', today()))
            ->orderBy('number')
            ->get()
            ->map(fn($t) => [
                'id'     => $t->id,
                'number' => $t->number,
                'status' => $t->status,
                'orders' => $t->orders->map(fn($o) => [
                    'id'            => $o->id,
                    'status'        => $o->status,
                    'customer_name' => $o->customer_name,
                    'total'         => (float) $o->total,
                    'amount_paid'   => (float) $o->amount_paid,
                    'is_active'     => ! in_array($o->status, ['delivered', 'cancelled']),
                    'items'         => $o->items->map(fn($i) => [
                        'dish'        => $i->dish?->name,
                        'quantity'    => $i->quantity,
                        'unit_price'  => (float) $i->unit_price,
                        'is_addition' => (bool) $i->is_addition,
                    ]),
                    'created_at' => $o->created_at->format('H:i'),
                ]),
            ]);

        // Domicilio orders of today (no table_id)
        $domicilios = Order::with(['items.dish'])
            ->whereDate('created_at', today())
            ->where('type', 'domicilio')
            ->orderBy('created_at')
            ->get()
            ->map(fn($o) => [
                'id'               => $o->id,
                'status'           => $o->status,
                'customer_name'    => $o->customer_name,
                'customer_phone'   => $o->customer_phone,
                'delivery_address' => $o->delivery_address,
                'total'            => (float) $o->total,
                'amount_paid'      => (float) $o->amount_paid,
                'is_active'        => ! in_array($o->status, ['delivered', 'cancelled']),
                'items'            => $o->items->map(fn($i) => [
                    'dish'        => $i->dish?->name,
                    'quantity'    => $i->quantity,
                    'unit_price'  => (float) $i->unit_price,
                    'is_addition' => (bool) $i->is_addition,
                ]),
                'created_at' => $o->created_at->format('H:i'),
            ]);

        $categories = Category::with([
            'dishes' => fn($q) => $q->where('available', true)->orderBy('sort_order')->orderBy('name'),
        ])
            ->where('active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn($c) => [
                'id'     => $c->id,
                'name'   => $c->name,
                'dishes' => $c->dishes->map(fn($d) => [
                    'id'          => $d->id,
                    'name'        => $d->name,
                    'price'       => (float) $d->price,
                    'description' => $d->description,
                ]),
            ])
            ->filter(fn($c) => count($c['dishes']) > 0)
            ->values();

        return Inertia::render('Adiciones', compact('tables', 'domicilios', 'categories'));
    }

    public function agregar(Request $request, Order $order)
    {
        $data = $request->validate([
            'items'              => 'required|array|min:1|max:50',
            'items.*.dish_id'    => 'required|integer|exists:dishes,id',
            'items.*.quantity'   => 'required|integer|min:1|max:99',
        ]);

        $wasClosed    = in_array($order->status, ['delivered', 'cancelled']);
        $wasDelivered = $order->status === 'delivered';

        // Snapshot total before adding items — used to credit prior payment on delivered orders.
        $previousTotal = (float) $order->total;

        $added = 0;
        foreach ($data['items'] as $item) {
            $dish = Dish::where('id', $item['dish_id'])->where('available', true)->first();
            if (! $dish) continue;

            $order->items()->create([
                'dish_id'     => $dish->id,
                'quantity'    => $item['quantity'],
                'unit_price'  => (float) $dish->price,
                'is_addition' => true,
            ]);
            $added++;
        }

        if ($added === 0) {
            return back()->withErrors(['error' => 'Ningún plato del pedido está disponible actualmente.']);
        }

        // Reopen closed orders so the new balance appears in Caja.
        // amount_paid is intentionally NOT modified here — it is only ever set
        // by registrarPago / cobrar so it already reflects the real payment history.
        if ($wasClosed) {
            $order->update(['status' => 'pending']);
        }

        $order->recalculateTotal();

        $action = $wasClosed ? 'Reapertura y adición' : 'Adición';
        AuditLog::registrar('update', 'Pedido', $order->id,
            "{$action} de {$added} ítem(s) al pedido #{$order->id} (nuevo total: \${$order->total})", [
                'items_added'  => $added,
                'new_total'    => (float) $order->total,
                'was_reopened' => $wasClosed,
            ]);

        $msg = $wasClosed
            ? "Pedido #{$order->id} reabierto con {$added} ítem(s) nuevo(s). Ya aparece en Caja para cobro."
            : "{$added} ítem(s) agregados al pedido #{$order->id}.";

        return back()->with('success', $msg);
    }
}
