<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTenantActive
{
    public function handle(Request $request, Closure $next): Response
    {
        // Solo aplica dentro de un contexto tenant
        if (!function_exists('tenant') || !tenant()) {
            return $next($request);
        }

        // Rutas que siempre deben funcionar aunque el tenant esté vencido o inactivo
        $allowedPrefixes = ['/login', '/logout', '/carta'];
        // '/carta' ya cubre '/carta/pedido' por el str_starts_with
        foreach ($allowedPrefixes as $prefix) {
            if (str_starts_with($request->getPathInfo(), $prefix)) {
                return $next($request);
            }
        }

        $paymentStatus = tenant()?->payment_status ?? 'paid';
        $active        = tenant()?->active ?? true;

        // Trial activo → acceso completo sin restricción
        if ($paymentStatus === 'trial' && $active) {
            return $next($request);
        }

        // Tenant cancelado — bloqueo total
        if ($paymentStatus === 'cancelled') {
            if ($request->header('X-Inertia')) {
                return response()->json(['error' => 'Cuenta cancelada.'], 403);
            }
            return redirect('/login')->with('error', 'Esta cuenta ha sido cancelada. Contacta a soporte.');
        }

        // Tenant vencido (overdue) o inactivo — solo se permite el dashboard para mostrar el aviso
        if ($paymentStatus === 'overdue' || (!$active && !in_array($paymentStatus, ['pending_payment', 'pending_review', 'trial']))) {
            if ($request->getPathInfo() === '/dashboard') {
                return $next($request);
            }
            if ($request->header('X-Inertia')) {
                return response()->json([], 409)
                    ->header('X-Inertia-Location', url('/dashboard'));
            }
            return redirect('/dashboard');
        }

        return $next($request);
    }
}
