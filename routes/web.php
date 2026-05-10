<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ── Auth ──────────────────────────────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/login',           [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login',          [AuthController::class, 'login']);
    Route::get('/admin/login',     [AuthController::class, 'showAdminLogin'])->name('admin.login');
    Route::post('/admin/login',    [AuthController::class, 'adminLogin']);
    Route::get('/forgot-password', fn() => Inertia::render('Auth/ForgotPassword'))->name('password.request');
    Route::post('/forgot-password', fn() => back())->name('password.email'); // placeholder
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// ── Públicas ──────────────────────────────────────────────────────────────────
Route::get('/', fn() => Inertia::render('Welcome'));
Route::get('/register', fn() => Inertia::render('Auth/Register'));
Route::get('/pricing',  fn() => Inertia::render('Pricing'));

// ── Panel restaurante (requiere auth) ─────────────────────────────────────────
Route::middleware('auth')->group(function () {
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

// ── Panel SuperAdmin (requiere auth + rol) ────────────────────────────────────
Route::middleware(['auth', 'role:administrador'])->prefix('admin')->group(function () {
    Route::get('/',          fn() => Inertia::render('Admin/Dashboard'));
    Route::get('/tenants',   fn() => Inertia::render('Placeholder', ['title' => 'Locales',     'icon' => '🏪']));
    Route::get('/analytics', fn() => Inertia::render('Placeholder', ['title' => 'Analítica',   'icon' => '📈']));
    Route::get('/billing',   fn() => Inertia::render('Placeholder', ['title' => 'Facturación', 'icon' => '💳']));
});
