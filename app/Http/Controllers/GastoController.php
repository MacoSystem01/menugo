<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Gasto;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GastoController extends Controller
{
    public function index(Request $request)
    {
        $query = Gasto::with('user')->latest('fecha')->latest('id');

        if ($request->filled('categoria')) {
            $query->where('categoria', $request->categoria);
        }

        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha', '>=', $request->fecha_desde);
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha', '<=', $request->fecha_hasta);
        }

        $gastos = $query->get()->map(fn($g) => [
            'id'          => $g->id,
            'descripcion' => $g->descripcion,
            'monto'       => (float) $g->monto,
            'categoria'   => $g->categoria,
            'fecha'       => $g->fecha->format('Y-m-d'),
            'notas'       => $g->notas,
            'registrado_por' => $g->user?->name,
            'created_at'  => $g->created_at->format('d/m/Y H:i'),
        ]);

        $totalFiltrado = $gastos->sum('monto');

        return Inertia::render('Gastos', [
            'gastos'        => $gastos,
            'totalFiltrado' => $totalFiltrado,
            'filters'       => $request->only(['categoria', 'fecha_desde', 'fecha_hasta']),
            'flash'         => session()->only(['success', 'error']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'descripcion' => 'required|string|max:255',
            'monto'       => 'required|numeric|min:0.01|max:99999999',
            'categoria'   => 'required|string|max:100',
            'fecha'       => 'required|date',
            'notas'       => 'nullable|string|max:1000',
        ]);

        $gasto = Gasto::create([
            ...$data,
            'user_id' => auth()->id(),
        ]);

        AuditLog::registrar('create', 'Gastos', $gasto->id, "Gasto '{$gasto->descripcion}' registrado", [
            'monto'     => (float) $gasto->monto,
            'categoria' => $gasto->categoria,
            'fecha'     => $gasto->fecha->format('Y-m-d'),
        ]);

        return back()->with('success', 'Gasto registrado correctamente.');
    }

    public function destroy(Gasto $gasto)
    {
        $desc = $gasto->descripcion;
        $id   = $gasto->id;

        AuditLog::registrar('delete', 'Gastos', $id, "Gasto '{$desc}' eliminado", [
            'monto'     => (float) $gasto->monto,
            'categoria' => $gasto->categoria,
            'fecha'     => $gasto->fecha->format('Y-m-d'),
        ]);

        $gasto->delete();

        return back()->with('success', 'Gasto eliminado.');
    }
}
