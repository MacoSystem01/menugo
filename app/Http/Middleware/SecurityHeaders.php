<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Inyecta cabeceras de seguridad HTTP en todas las respuestas.
 *
 * Protecciones habilitadas:
 * - X-Content-Type-Options: previene MIME-sniffing (XSS vector)
 * - X-Frame-Options: previene clickjacking
 * - Referrer-Policy: limita información enviada en el header Referer
 * - Permissions-Policy: deshabilita APIs del navegador innecesarias
 * - Content-Security-Policy: restringe orígenes de scripts/estilos/media
 * - Strict-Transport-Security: fuerza HTTPS en producción
 * - X-XSS-Protection: deshabilitado intencionalmente (deprecated, puede crear vulnerabilidades)
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // ── Cabeceras de seguridad estándar ───────────────────────────────────

        // Evita que el navegador "adivine" el Content-Type (vector de XSS)
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Previene que la app sea embebida en un iframe (clickjacking)
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // No enviar el URL completo como referer a terceros
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Deshabilitar APIs del navegador no usadas
        $response->headers->set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(self), payment=()'
        );

        // ── Content-Security-Policy ───────────────────────────────────────────
        // Configurada para ser compatible con Inertia + React + Vite.
        // 'unsafe-inline' en style-src es necesario para Tailwind/Radix UI (estilos inline).
        // 'unsafe-eval' en script-src es necesario para React en desarrollo (HMR/eval).
        // En producción con assets buildeados se puede eliminar 'unsafe-eval'.
        //
        // Para Google Maps (API key configurada en .env):
        // - maps.googleapis.com: carga del script de Google Maps
        // - maps.gstatic.com: assets del mapa (tiles, iconos)
        //
        // blob: y data: en img-src son necesarios para:
        // - blob: generación de QR codes (qrcode.react)
        // - data: imágenes en base64 (algunos componentes de UI)

        $isDev  = app()->environment('local', 'testing');
        $appUrl = rtrim((string) config('app.url', ''), '/');

        // ── Multi-tenant: wildcard de subdominios ─────────────────────────────
        $parsed      = parse_url($appUrl);
        $scheme      = $parsed['scheme'] ?? 'https';
        $host        = $parsed['host']   ?? '';
        $wildcardUrl = "{$scheme}://*.{$host}";

        // ── Vite dev server ───────────────────────────────────────────────────
        // Detectamos el dev server por public/hot (archivo que Vite crea al
        // arrancar y elimina al buildear), no por APP_ENV. Esto cubre el caso
        // XAMPP donde APP_ENV=production pero Vite corre en modo dev.
        $isViteDev = file_exists(public_path('hot'));
        $viteUrl   = $isViteDev ? ($appUrl . ':5173') : '';

        // 'unsafe-eval' requerido por Vite HMR / React Fast Refresh en desarrollo.
        $scriptSrc = $isViteDev
            ? "'self' 'unsafe-inline' 'unsafe-eval' {$appUrl} {$viteUrl}"
            : "'self' 'unsafe-inline' {$appUrl}";

        // connect-src: incluye Vite HMR (HTTP + WS) cuando el dev server está activo.
        $connectSrc = $isViteDev
            ? "'self' https://maps.googleapis.com wss: {$viteUrl}"
            : "'self' https://maps.googleapis.com wss:";

        // img-src: dominio central + wildcard subdominios + Vite si está activo.
        $imgSrcExtra = "{$appUrl} {$wildcardUrl}" . ($isViteDev ? " {$viteUrl}" : '');

        $csp = implode('; ', [
            "default-src 'self'",
            "script-src {$scriptSrc} https://maps.googleapis.com",
            // worker-src: Vite HMR crea un Web Worker desde blob: en desarrollo.
            // Sin esta directiva el navegador usa script-src como fallback y bloquea
            // el worker → el HMR no funciona → el JS de la página no se inicializa
            // completamente → Inertia/Axios no puede leer el CSRF token → HTTP 419.
            "worker-src blob:",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com" . ($isViteDev ? " {$viteUrl}" : ''),
            "font-src 'self' https://fonts.gstatic.com data:" . ($isViteDev ? " {$viteUrl}" : ''),
            "img-src 'self' data: blob: {$imgSrcExtra} https://maps.gstatic.com https://maps.googleapis.com",
            "connect-src {$connectSrc}",
            "frame-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]);

        $response->headers->set('Content-Security-Policy', $csp);

        // ── HSTS: forzar HTTPS en producción ─────────────────────────────────
        if (app()->isProduction() && $request->isSecure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );
        }

        return $response;
    }
}
