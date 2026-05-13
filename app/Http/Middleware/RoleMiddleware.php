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

        foreach ($permissions as $permission) {
            if ($request->user()->hasPermissionTo($permission)) {
                return $next($request);
            }
        }

        return redirect('/dashboard')
            ->with('error', 'No tienes permiso para acceder a esta sección.');
    }
}
