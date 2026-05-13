<?php

namespace App\Http\Controllers;

use App\Models\RestaurantTable;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TableController extends Controller
{
    public function index()
    {
        $tables = RestaurantTable::with(['activeOrders.items.dish'])
            ->orderBy('number')
            ->get()
            ->map(fn($t) => [
                'id'                  => $t->id,
                'number'              => $t->number,
                'capacity'            => $t->capacity,
                'status'              => $t->status,
                'qr_code'             => $t->qr_code,
                'active_orders_count' => $t->activeOrders->count(),
                'orders'              => $t->activeOrders->map(fn($o) => [
                    'id'          => $o->id,
                    'status'      => $o->status,
                    'total'       => (float) $o->total,
                    'items_count' => $o->items->count(),
                    'items'       => $o->items->map(fn($i) => [
                        'dish'     => $i->dish?->name,
                        'quantity' => $i->quantity,
                    ]),
                    'created_at'  => $o->created_at->format('H:i'),
                ]),
            ]);

        return Inertia::render('Tables', compact('tables'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'number'   => 'required|integer|min:1|unique:restaurant_tables,number',
            'capacity' => 'required|integer|min:1',
        ]);

        RestaurantTable::create([
            'number'   => $data['number'],
            'capacity' => $data['capacity'],
            'status'   => 'available',
            'qr_code'  => Str::uuid(),
        ]);

        return back()->with('success', "Mesa #{$data['number']} creada.");
    }

    public function update(Request $request, RestaurantTable $table)
    {
        $data = $request->validate([
            'number'   => "required|integer|min:1|unique:restaurant_tables,number,{$table->id}",
            'capacity' => 'required|integer|min:1',
            'status'   => 'required|in:available,occupied,reserved',
        ]);

        $table->update($data);

        return back()->with('success', 'Mesa actualizada.');
    }

    public function destroy(RestaurantTable $table)
    {
        if ($table->active_orders_count > 0 || $table->activeOrders()->exists()) {
            return back()->withErrors(['error' => 'No se puede eliminar: la mesa tiene pedidos activos.']);
        }

        $table->delete();

        return back()->with('success', 'Mesa eliminada.');
    }
}
