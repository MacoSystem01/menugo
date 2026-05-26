<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // The domain route group uses {tenant} to match subdomains, but controllers
        // must NOT receive it as a positional argument — Stancl resolves the tenant
        // via $request->getHost() in its own middleware, independently of this param.
        // Binding to null causes parametersWithoutNulls() to drop it before dispatch.
        Route::bind('tenant', fn($value) => null);

        $this->configureRateLimiting();
    }

    /**
     * Configura los limitadores de tasa para soporte de +1000 usuarios simultáneos.
     * Diseñados para proteger sin bloquear usuarios legítimos.
     */
    protected function configureRateLimiting(): void
    {
        // ── Carta pública: pedidos QR ─────────────────────────────────────────
        // 30 pedidos por minuto por IP — ya configurado en la ruta con throttle:30,1
        // Este named limiter permite configuración centralizada
        RateLimiter::for('carta.pedido', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip());
        });

        // ── Login de restaurante: anti brute-force ────────────────────────────
        // 10 intentos por minuto por IP — ya configurado en ruta con throttle:10,1
        RateLimiter::for('auth.login', function (Request $request) {
            return [
                Limit::perMinute(10)->by($request->ip()),
                Limit::perHour(30)->by($request->ip()),
            ];
        });

        // ── API pública ───────────────────────────────────────────────────────
        // Búsqueda de tenants, verificación de identidad publicitaria
        RateLimiter::for('api.public', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });

        // ── Admin panel ───────────────────────────────────────────────────────
        // Operaciones sensibles: crear tenant, aprobar solicitudes
        RateLimiter::for('admin.operations', function (Request $request) {
            return Limit::perMinute(30)->by(optional($request->user())->id ?: $request->ip());
        });

        // ── Global web (fallback) ─────────────────────────────────────────────
        // 300 req/min por IP para tráfico general de la app web
        RateLimiter::for('web.global', function (Request $request) {
            return Limit::perMinute(300)->by($request->ip());
        });
    }
}
