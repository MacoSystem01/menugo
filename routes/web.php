<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ── Públicas (dominio central menugo.local) ───────────────────────────────────
Route::get('/',                 fn() => Inertia::render('Welcome'));
Route::get('/pricing',          fn() => Inertia::render('Pricing'));
Route::get('/register',         fn() => Inertia::render('Auth/Register'));
Route::get('/register/success', [TenantController::class, 'registerSuccess'])->name('register.success');
Route::post('/register',        [TenantController::class, 'publicRegister'])->name('tenant.register');
Route::get('/tenant/find',      [TenantController::class, 'find'])->name('tenant.find');

// ── Auth SuperAdmin (URL configurada en .env → ADMIN_LOGIN_PATH) ──────────────
$adminPath = env('ADMIN_LOGIN_PATH', 'sistema/acceso-control');

Route::middleware('guest')->group(function () use ($adminPath) {
    Route::get("/{$adminPath}",  [AuthController::class, 'showAdminLogin'])->name('admin.login');
    Route::post("/{$adminPath}", [AuthController::class, 'adminLogin']);
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// ── Panel SuperAdmin ──────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:administrador'])->prefix('admin')->group(function () {
    Route::get('/',                      [AdminDashboardController::class, 'index']);
    Route::get('/tenants',               [TenantController::class, 'index'])->name('admin.tenants');
    Route::post('/tenants',              [TenantController::class, 'store'])->name('admin.tenants.store');
    Route::delete('/tenants/{tenant}',   [TenantController::class, 'destroy'])->name('admin.tenants.destroy');
    Route::get('/analytics',             fn() => Inertia::render('Placeholder', ['title' => 'Analítica',   'icon' => '📈']));
    Route::get('/billing',               fn() => Inertia::render('Placeholder', ['title' => 'Facturación', 'icon' => '💳']));
});
