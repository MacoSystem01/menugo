<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventarioController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'status' => 'nullable|in:ok,bajo,agotado,vencido',
        ]);

        // Stats from full table (unfiltered) for accurate summary
        $resumen = InventoryItem::selectRaw("
            COUNT(*) as total,
            SUM(status = 'ok')      as ok,
            SUM(status = 'bajo')    as bajo,
            SUM(status = 'agotado') as agotado,
            SUM(status = 'vencido') as vencido
        ")->first();

        $query = InventoryItem::query()->orderBy('name');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $items = $query->paginate(50)->through(fn($i) => [
            'id'          => $i->id,
            'name'        => $i->name,
            'quantity'    => (float) $i->quantity,
            'unit'        => $i->unit,
            'unit_price'  => (float) $i->unit_price,
            'total_value' => (float) $i->total_value,
            'status'      => $i->status,
            'expiry_date' => $i->expiry_date?->format('Y-m-d'),
            'notes'       => $i->notes,
        ]);

        $porVencer = InventoryItem::whereNotNull('expiry_date')
            ->whereDate('expiry_date', '>=', today())
            ->whereDate('expiry_date', '<=', today()->addDays(3))
            ->where('status', '!=', 'vencido')
            ->orderBy('expiry_date')
            ->get()
            ->map(fn($i) => [
                'id'          => $i->id,
                'name'        => $i->name,
                'expiry_date' => $i->expiry_date->format('d/m/Y'),
                'dias'        => (int) today()->diffInDays($i->expiry_date),
            ]);

        return Inertia::render('Inventario', [
            'items'      => $items,
            'resumen'    => [
                'total'   => (int) $resumen->total,
                'ok'      => (int) $resumen->ok,
                'bajo'    => (int) $resumen->bajo,
                'agotado' => (int) $resumen->agotado,
                'vencido' => (int) $resumen->vencido,
            ],
            'filters'    => $request->only(['status']),
            'por_vencer' => $porVencer,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:150',
            'quantity'    => 'required|numeric|min:0',
            'unit'        => 'nullable|string|max:30',
            'unit_price'  => 'required|numeric|min:0',
            'status'      => 'required|in:ok,bajo,agotado,vencido',
            'expiry_date' => 'nullable|date',
            'notes'       => 'nullable|string|max:255',
        ]);

        $data['unit'] = $data['unit'] ?? '';

        $item = InventoryItem::create($data);

        AuditLog::registrar('create', 'Inventario', $item->id, "Producto '{$item->name}' agregado al inventario", [
            'quantity'    => (float) $item->quantity,
            'unit'        => $item->unit,
            'unit_price'  => (float) $item->unit_price,
            'status'      => $item->status,
            'expiry_date' => $item->expiry_date?->format('Y-m-d'),
        ]);

        return back()->with('success', "Producto '{$data['name']}' agregado al inventario.");
    }

    public function update(Request $request, InventoryItem $inventario)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:150',
            'quantity'    => 'required|numeric|min:0',
            'unit'        => 'nullable|string|max:30',
            'unit_price'  => 'required|numeric|min:0',
            'status'      => 'required|in:ok,bajo,agotado,vencido',
            'expiry_date' => 'nullable|date',
            'notes'       => 'nullable|string|max:255',
        ]);

        $data['unit'] = $data['unit'] ?? '';

        $old = $inventario->only(['name', 'quantity', 'unit_price', 'status', 'expiry_date']);
        $inventario->update($data);

        AuditLog::registrar('update', 'Inventario', $inventario->id, "Producto '{$inventario->name}' actualizado en inventario", [
            'old' => $old,
            'new' => $inventario->only(['name', 'quantity', 'unit_price', 'status', 'expiry_date']),
        ]);

        return back()->with('success', 'Producto actualizado.');
    }

    public function destroy(InventoryItem $inventario)
    {
        $name = $inventario->name;
        $id   = $inventario->id;
        $inventario->delete();

        AuditLog::registrar('delete', 'Inventario', $id, "Producto '{$name}' eliminado del inventario");

        return back()->with('success', 'Producto eliminado del inventario.');
    }
}
