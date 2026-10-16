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

        if (!$tenant) {
            \Log::info("CheckTenantFeature: tenant is null");
        } else {
            \Log::info("CheckTenantFeature: feature={$feature}, hasFeature=" . ($tenant->hasFeature($feature) ? 'true' : 'false'));
        }

        if ($tenant && !$tenant->hasFeature($feature)) {
            \Log::info("CheckTenantFeature: Blocking access to {$feature}");
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                // Return an explicit Inertia response for 403 instead of aborting
                // Or just redirect back for now so it works
                return redirect('/dashboard')->with('error', 'Tu plan actual no incluye esta funcionalidad. Mejora tu plan para acceder.');
            }

            return redirect('/upgrade')->with('error', 'Mejora tu plan para acceder a esta función.');
        }

        return $next($request);
    }
}
