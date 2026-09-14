<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTenantFeature
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $tenant = tenant();

        if ($tenant && !$tenant->hasFeature($feature)) {
            // Si la petición espera JSON (ej. API o Inertia), mandamos un error 403
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                abort(403, 'Tu plan actual no incluye esta funcionalidad. Mejora tu plan para acceder.');
            }

            // De lo contrario redirigimos a una página de upgrade
            return redirect()->route('tenant.upgrade')->with('error', 'Mejora tu plan para acceder a esta función.');
        }

        return $next($request);
    }
}
