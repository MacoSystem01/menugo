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
 * - X-XSS-Protection: deshabilitado intencionalmente (deprecated, puede crear vulnerabilidades)
 *
 * NO se añade Content-Security-Policy aquí porque Inertia+Vite+React requiere
 * configuración cuidadosa (hashes de scripts, nonces). Añadir en producción.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

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

        // Forzar HTTPS en producción (HSTS)
        if (app()->isProduction() && $request->isSecure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );
        }

        return $response;
    }
}
