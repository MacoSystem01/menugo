<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Stancl\Tenancy\Middleware\InitializeTenancyBySubdomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

Route::domain('{tenant}.' . parse_url(config('app.url'), PHP_URL_HOST))
    ->middleware([
        'web',
        InitializeTenancyBySubdomain::class,
        PreventAccessFromCentralDomains::class,
    ])->group(function () {

    // ── Auth del restaurante ──────────────────────────────────────────────────
    Route::middleware('guest')->group(function () {
        Route::get('/login',  [AuthController::class, 'showLogin'])->name('tenant.login');
        Route::post('/login', [AuthController::class, 'login']);
        Route::get('/forgot-password', fn() => Inertia::render('Auth/ForgotPassword'))->name('password.request');
        Route::post('/forgot-password', fn() => back())->name('password.email');
    });

    Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

    // ── Panel restaurante (requiere auth) ─────────────────────────────────────
    Route::middleware('auth')->group(function () {
        Route::get('/',                 fn() => redirect('/dashboard'));
        Route::get('/dashboard',        fn() => Inertia::render('Dashboard'));
        Route::get('/usuarios',         fn() => Inertia::render('Placeholder', ['title' => 'Usuarios',    'icon' => '👥']));
        Route::get('/menu/categorias',  fn() => Inertia::render('Placeholder', ['title' => 'Categorías',  'icon' => '🏷️']));
        Route::get('/menu/platos',      fn() => Inertia::render('Placeholder', ['title' => 'Platos',      'icon' => '🍽️']));
        Route::get('/caja',             fn() => Inertia::render('Placeholder', ['title' => 'Caja',        'icon' => '💵']));
        Route::get('/pedidos',          fn() => Inertia::render('Placeholder', ['title' => 'Pedidos',     'icon' => '📦']));
        Route::get('/cocina',           fn() => Inertia::render('Placeholder', ['title' => 'Cocina',      'icon' => '🍳']));
        Route::get('/cocina/novedades', fn() => Inertia::render('Placeholder', ['title' => 'Novedades',   'icon' => '⚠️']));
        Route::get('/tables',           fn() => Inertia::render('Placeholder', ['title' => 'Mesa',        'icon' => '🪑']));
        Route::get('/domicilio',        fn() => Inertia::render('Placeholder', ['title' => 'Domicilio',   'icon' => '🛵']));
        Route::get('/inventario',       fn() => Inertia::render('Placeholder', ['title' => 'Inventario',  'icon' => '📋']));
        Route::get('/reporte',          fn() => Inertia::render('Placeholder', ['title' => 'Reporte',     'icon' => '📊']));
    });
});
