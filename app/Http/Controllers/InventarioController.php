<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventarioController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryItem::query()->orderBy('name');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $items = $query->get()->map(fn($i) => [
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

        $resumen = [
            'total'   => $items->count(),
            'ok'      => $items->where('status', 'ok')->count(),
            'bajo'    => $items->where('status', 'bajo')->count(),
            'agotado' => $items->where('status', 'agotado')->count(),
            'vencido' => $items->where('status', 'vencido')->count(),
        ];

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
            'resumen'    => $resumen,
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

        InventoryItem::create($data);

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

        $inventario->update($data);

        return back()->with('success', 'Producto actualizado.');
    }

    public function destroy(InventoryItem $inventario)
    {
        $inventario->delete();

        return back()->with('success', 'Producto eliminado del inventario.');
    }
}
