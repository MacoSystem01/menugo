<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::latest();

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('type')) {
            $query->where('auditable_type', $request->type);
        }

        if ($request->filled('causer')) {
            $query->where('causer_name', 'like', "%{$request->causer}%");
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
            'properties'     => $l->properties,
            'created_at'     => $l->created_at->format('d/m/Y H:i:s'),
        ]);

        $actions = AuditLog::select('action')->distinct()->pluck('action')->sort()->values();
        $types   = AuditLog::select('auditable_type')->distinct()->pluck('auditable_type')->sort()->values();

        return Inertia::render('Auditoria', [
            'logs'    => $logs,
            'actions' => $actions,
            'types'   => $types,
            'filters' => $request->only(['action', 'type', 'causer', 'fecha']),
        ]);
    }
}
