<?php

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withProviders([
        App\Providers\TenancyServiceProvider::class,
    ])
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);
        $middleware->replace(
            \Illuminate\Auth\Middleware\RedirectIfAuthenticated::class,
            \App\Http\Middleware\RedirectIfAuthenticated::class,
        );
        $middleware->alias([
            'guest'      => \App\Http\Middleware\RedirectIfAuthenticated::class,
            'role'       => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'perm'       => \App\Http\Middleware\RoleMiddleware::class,
        ]);
        // Redirigir a /login en tenant, o al path de admin configurado en el dominio central
        $middleware->redirectGuestsTo(function (Request $request) {
            $host = $request->getHost();
            $centralHost = parse_url(config('app.url'), PHP_URL_HOST);
            $centralDomains = [$centralHost, '127.0.0.1', 'localhost'];

            if (!in_array($host, $centralDomains)) {
                return '/login';
            }

            return '/' . ltrim(config('app.admin_login_path', env('ADMIN_LOGIN_PATH', 'sistema/acceso-control')), '/');
        });

        // Inertia envía X-XSRF-TOKEN automáticamente en todas las peticiones.
        // Solo se excluye /logout para que funcione incluso con sesión expirada.
        $middleware->validateCsrfTokens(except: [
            '/logout',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (ModelNotFoundException $_, Request $request) {
            if ($request->header('X-Inertia')) {
                return back()->with('error', 'El registro solicitado no fue encontrado.');
            }
        });
    })->create();
