<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Verifica que el usuario tenga al menos uno de los permisos indicados.
 * Uso en rutas: ->middleware('perm:permiso.accion')
 *               ->middleware('perm:permiso.a|permiso.b')   (cualquiera vale)
 */
class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        if (! $request->user()) {
            return redirect('/login');
        }

        // Support 'perm:a|b' notation — each param may contain '|'-separated alternatives
        $flat = [];
        foreach ($permissions as $p) {
            foreach (explode('|', $p) as $part) {
                $flat[] = trim($part);
            }
        }

        try {
            foreach ($flat as $permission) {
                if ($request->user()->hasPermissionTo($permission)) {
                    return $next($request);
                }
            }
        } catch (\Throwable) {
            // Las tablas de Spatie aún no están seeded en este tenant.
            // Permitir el acceso únicamente si el usuario tiene el flag is_system,
            // de lo contrario redirigir con mensaje.
            if ($request->user()->is_system ?? false) {
                return $next($request);
            }

            return redirect('/dashboard')
                ->with('error', 'El sistema de permisos no está configurado. Contacta al administrador.');
        }

        return redirect('/dashboard')
            ->with('error', 'No tienes permiso para acceder a esta sección.');
    }
}
