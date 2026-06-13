<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'action'   => 'nullable|string|max:50',
            'type'     => 'nullable|string|max:50',
            'table_id' => 'nullable|integer|min:1',
            'causer'   => 'nullable|string|max:150',
            'fecha'    => 'nullable|date_format:Y-m-d',
        ]);

        $query = AuditLog::latest();

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('type')) {
            $query->where('auditable_type', $request->type);

            if ($request->filled('table_id')) {
                $tableId = (int) $request->table_id;
                if ($request->type === 'Mesa') {
                    $query->where('auditable_id', $tableId);
                } elseif ($request->type === 'Pedido') {
                    $query->where('properties->table_id', $tableId);
                }
            }
        }

        if ($request->filled('causer')) {
            $query->where('causer_name', 'like', '%' . addcslashes($request->causer, '%_\\') . '%');
        }

        if ($request->filled('fecha')) {
            $query->whereDate('created_at', $request->fecha);
        }

        $logs = $query->paginate(50)->through(fn($l) => [
            'id'             => $l->id,
            'action'         => $l->action,
            'auditable_type' => $l->auditable_type,
            'auditable_id'   => $l->auditable_id,
            'description'    => $l->description,
            'causer_name'    => $l->causer_name,
            'properties'     => rescue(fn() => $l->properties, null, false),
            'created_at'     => $l->created_at->format('d/m/Y H:i:s'),
        ]);

        $actions = AuditLog::select('action')->distinct()->pluck('action')->sort()->values();
        
        // Obtenemos los tipos que existen en la base de datos y nos aseguramos de que 'Mesa' esté disponible si se desea filtrar.
        $types = AuditLog::select('auditable_type')->distinct()->pluck('auditable_type')->toArray();
        if (!in_array('Mesa', $types)) {
            $types[] = 'Mesa';
        }
        sort($types);

        $tables = \App\Models\RestaurantTable::select('id', 'number')->orderBy('number')->get();

        return Inertia::render('Auditoria', [
            'logs'    => $logs,
            'actions' => $actions,
            'types'   => $types,
            'tables'  => $tables,
            'filters' => $request->only(['action', 'type', 'causer', 'fecha', 'table_id']),
        ]);
    }
}
