<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsRestaurante
{
    public function handle(Request $request, Closure $next): Response
    {
        if (function_exists('tenant') && tenant() && tenant('type') === 'puesto') {
            if ($request->header('X-Inertia')) {
                return back()->withErrors(['error' => 'Módulo no disponible para Puestos de Comida Rápida.']);
            }
            return redirect('/dashboard');
        }

        return $next($request);
    }
}
