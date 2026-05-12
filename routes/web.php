<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ── Públicas (dominio central menugo.local) ───────────────────────────────────
Route::get('/',         fn() => Inertia::render('Welcome'));
Route::get('/pricing',  fn() => Inertia::render('Pricing'));
Route::get('/register', fn() => Inertia::render('Auth/Register'));
Route::post('/register', [TenantController::class, 'store'])->name('tenant.register');

// ── Auth SuperAdmin ───────────────────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/admin/login',  [AuthController::class, 'showAdminLogin'])->name('admin.login');
    Route::post('/admin/login', [AuthController::class, 'adminLogin']);
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// ── Panel SuperAdmin ──────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:administrador'])->prefix('admin')->group(function () {
    Route::get('/',          fn() => Inertia::render('Admin/Dashboard'));
    Route::get('/tenants',             [TenantController::class, 'index'])->name('admin.tenants');
    Route::post('/tenants',            [TenantController::class, 'store'])->name('admin.tenants.store');
    Route::delete('/tenants/{tenant}', [TenantController::class, 'destroy'])->name('admin.tenants.destroy');
    Route::get('/analytics', fn() => Inertia::render('Placeholder', ['title' => 'Analítica',   'icon' => '📈']));
    Route::get('/billing',   fn() => Inertia::render('Placeholder', ['title' => 'Facturación', 'icon' => '💳']));
});
