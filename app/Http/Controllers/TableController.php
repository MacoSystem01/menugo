<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\RestaurantTable;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TableController extends Controller
{
    public function index()
    {
        // Auto-set to occupied when a new digital order arrives; releasing is always manual
        RestaurantTable::whereHas('activeOrders')
            ->where('status', '!=', 'occupied')
            ->update(['status' => 'occupied']);

        $tables = RestaurantTable::with([
                'orders' => fn($q) => $q
                    ->with('items.dish')
                    ->whereDate('created_at', today())
                    ->where('status', '!=', 'cancelled')
                    ->orderBy('created_at'),
            ])
            ->orderBy('number')
            ->get()
            ->map(fn($t) => [
                'id'                  => $t->id,
                'number'              => $t->number,
                'capacity'            => $t->capacity,
                'status'              => $t->status,
                'qr_code'             => $t->qr_code,
                'active_orders_count' => $t->orders
                    ->filter(fn($o) => ! in_array($o->status, ['delivered', 'cancelled']))
                    ->count(),
                'orders'              => $t->orders->map(fn($o) => [
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

        // Cancelaciones recientes (últimos 5 min) para alertar a meseros
        $recentCancellations = \App\Models\Order::with('table')
            ->where('status', 'cancelled')
            ->whereDate('created_at', today())
            ->where('updated_at', '>=', now()->subMinutes(5))
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn($o) => [
                'id'    => $o->id,
                'mesa'  => $o->table?->number,
                'total' => (float) $o->total,
            ]);

        // Pedidos tipo mesa sin mesa asignada (hoy, no cancelados)
        $tablelessOrders = \App\Models\Order::with('items.dish')
            ->where('type', 'mesa')
            ->whereNull('table_id')
            ->whereDate('created_at', today())
            ->where('status', '!=', 'cancelled')
            ->orderBy('created_at')
            ->get()
            ->map(fn($o) => [
                'id'            => $o->id,
                'status'        => $o->status,
                'total'         => (float) $o->total,
                'items_count'   => $o->items->count(),
                'customer_name' => $o->customer_name,
                'items'         => $o->items->map(fn($i) => [
                    'dish'     => $i->dish?->name,
                    'quantity' => $i->quantity,
                ]),
                'created_at'    => $o->created_at->format('H:i'),
            ]);

        return Inertia::render('Tables', compact('tables', 'recentCancellations', 'tablelessOrders'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'number'   => 'required|integer|min:1|unique:restaurant_tables,number',
            'capacity' => 'required|integer|min:1',
        ]);

        $table = RestaurantTable::create([
            'number'   => $data['number'],
            'capacity' => $data['capacity'],
            'status'   => 'available',
            'qr_code'  => Str::uuid(),
        ]);

        AuditLog::registrar('create', 'Mesa', $table->id, "Mesa #{$data['number']} creada con capacidad {$data['capacity']}", [
            'number'   => $data['number'],
            'capacity' => $data['capacity'],
        ]);

        return back()->with('success', "Mesa #{$data['number']} creada.");
    }

    public function update(Request $request, RestaurantTable $table)
    {
        $canChangeStatus = $request->user()?->hasAnyRole(['gerente', 'administrador']) ?? false;

        $data = $request->validate([
            'number'   => "required|integer|min:1|unique:restaurant_tables,number,{$table->id}",
            'capacity' => 'required|integer|min:1',
            'status'   => $canChangeStatus ? 'nullable|in:available,occupied,reserved' : 'sometimes',
        ]);

        if (! $canChangeStatus) {
            unset($data['status']);
        }

        $old = $table->getAttributes();
        $table->update($data);

        AuditLog::registrar('update', 'Mesa', $table->id, "Mesa #{$table->number} actualizada", [
            'old' => array_intersect_key($old, $data),
            'new' => $data,
        ]);

        return back()->with('success', 'Mesa actualizada.');
    }

    public function liberar(RestaurantTable $table)
    {
        if ($table->activeOrders()->exists()) {
            return back()->withErrors(['error' => "La mesa #{$table->number} aún tiene pedidos activos."]);
        }

        $prevStatus = $table->status;
        $table->update(['status' => 'available']);

        AuditLog::registrar('update', 'Mesa', $table->id, "Mesa #{$table->number} liberada", [
            'prev_status' => $prevStatus,
            'new_status'  => 'available',
        ]);

        return back()->with('success', "Mesa #{$table->number} liberada y disponible.");
    }

    public function destroy(RestaurantTable $table)
    {
        if ($table->active_orders_count > 0 || $table->activeOrders()->exists()) {
            return back()->withErrors(['error' => 'No se puede eliminar: la mesa tiene pedidos activos.']);
        }

        $tableNum = $table->number;
        $tableId  = $table->id;
        $table->delete();

        AuditLog::registrar('delete', 'Mesa', $tableId, "Mesa #{$tableNum} eliminada");

        return back()->with('success', 'Mesa eliminada.');
    }
}
