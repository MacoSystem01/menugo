<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $tenants = Tenant::with('domains')->latest()->get();

        $total = $tenants->count();

        // Agrupar por tipo (campo guardado en la columna JSON `data`)
        $porTipo = $tenants->groupBy(fn($t) => $t->type ?? 'otro')->map->count();

        // Últimos 10 registros para la tabla principal
        $lista = $tenants->take(10)->map(fn($t) => [
            'id'        => $t->id,
            'name'      => $t->name,
            'type'      => $t->type ?? 'restaurante',
            'plan'      => $t->plan ?? '—',
            'subdomain' => $t->domains->first()?->domain,
            'created_at'=> $t->created_at?->format('d/m/Y'),
        ]);

        return Inertia::render('Admin/Dashboard', [
            'total'   => $total,
            'por_tipo'=> $porTipo,
            'lista'   => $lista,
        ]);
    }
}
