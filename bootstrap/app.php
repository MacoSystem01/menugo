<?php

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
            $centralHost = parse_url(config('app.url'), PHP_URL_HOST);

            if ($request->getHost() !== $centralHost) {
                return '/login';
            }

            return '/' . ltrim(env('ADMIN_LOGIN_PATH', 'sistema/acceso-control'), '/');
        });

        // Excepción de CSRF para desarrollo local (Bypass 419 error)
        $middleware->validateCsrfTokens(except: [
            '/login',
            '/logout',
            'sistema/acceso-control',
            '/admin/login'
        ]);
    })
    ->withExceptions(function (Exceptions $_): void {
        //
    })->create();
