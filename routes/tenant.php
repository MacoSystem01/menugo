<?php

declare(strict_types=1);

use App\Http\Controllers\AuditController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartaController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CocinaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DishController;
use App\Http\Controllers\DomicilioController;
use App\Http\Controllers\InventarioController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

Route::domain('{tenant}.' . parse_url(config('app.url'), PHP_URL_HOST))
    ->middleware([
        'web',
        InitializeTenancyByDomain::class,
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

    // ── Carta pública (sin auth, acceso del cliente vía QR) ──────────────────
    Route::get('/carta', [CartaController::class, 'public'])->name('carta.public');
    Route::post('/carta/pedido', [CartaController::class, 'placeOrder'])->name('carta.pedido');

    // ── Panel restaurante (requiere auth) ─────────────────────────────────────
    Route::middleware('auth')->group(function () {
        Route::get('/', fn() => redirect('/dashboard'));

        // Dashboard — accesible para todos los roles autenticados
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // ── Usuarios ─────────────────────────────────────────────────────────
        Route::get('/usuarios',                   [UserController::class, 'index'])
            ->middleware('perm:usuarios.ver')
            ->name('usuarios');

        Route::post('/usuarios',                  [UserController::class, 'store'])
            ->middleware('perm:usuarios.crear')
            ->name('usuarios.store');

        Route::put('/usuarios/{user}',            [UserController::class, 'update'])
            ->middleware('perm:usuarios.editar')
            ->name('usuarios.update');

        Route::post('/usuarios/{user}/password',  [UserController::class, 'resetPassword'])
            ->middleware('perm:usuarios.editar')
            ->name('usuarios.password');

        Route::delete('/usuarios/{user}',         [UserController::class, 'destroy'])
            ->middleware('perm:usuarios.eliminar')
            ->name('usuarios.destroy');

        // ── Menú → Carta ─────────────────────────────────────────────────────
        Route::get('/menu/carta',                              [CartaController::class, 'admin'])
            ->middleware('perm:carta.ver')
            ->name('carta.admin');

        Route::put('/menu/carta/settings',                     [CartaController::class, 'saveSettings'])
            ->middleware('perm:carta.editar')
            ->name('carta.settings.save');

        Route::post('/menu/carta/banner',                      [CartaController::class, 'uploadBanner'])
            ->middleware('perm:carta.editar')
            ->name('carta.banner.upload');

        Route::delete('/menu/carta/banner',                    [CartaController::class, 'deleteBanner'])
            ->middleware('perm:carta.editar')
            ->name('carta.banner.delete');

        Route::post('/menu/carta/plato/{dish}/imagen',         [CartaController::class, 'uploadImage'])
            ->middleware('perm:carta.editar')
            ->name('carta.imagen.upload');

        Route::delete('/menu/carta/plato/{dish}/imagen',       [CartaController::class, 'deleteImage'])
            ->middleware('perm:carta.editar')
            ->name('carta.imagen.delete');

        Route::put('/menu/carta/plato/{dish}',                 [CartaController::class, 'updateDish'])
            ->middleware('perm:carta.editar')
            ->name('carta.plato.update');

        // ── Menú → Categorías ────────────────────────────────────────────────
        Route::get('/menu/categorias',                          [CategoryController::class, 'index'])
            ->middleware('perm:categorias.ver')
            ->name('categorias');

        Route::post('/menu/categorias',                         [CategoryController::class, 'store'])
            ->middleware('perm:categorias.crear')
            ->name('categorias.store');

        Route::put('/menu/categorias/{category}',               [CategoryController::class, 'update'])
            ->middleware('perm:categorias.editar')
            ->name('categorias.update');

        Route::post('/menu/categorias/{category}/reorder',      [CategoryController::class, 'reorder'])
            ->middleware('perm:categorias.editar')
            ->name('categorias.reorder');

        Route::delete('/menu/categorias/{category}',            [CategoryController::class, 'destroy'])
            ->middleware('perm:categorias.eliminar')
            ->name('categorias.destroy');

        // ── Menú → Platos ────────────────────────────────────────────────────
        Route::get('/menu/platos',           [DishController::class, 'index'])
            ->middleware('perm:platos.ver')
            ->name('platos');

        Route::post('/menu/platos',          [DishController::class, 'store'])
            ->middleware('perm:platos.crear')
            ->name('platos.store');

        Route::put('/menu/platos/{dish}',    [DishController::class, 'update'])
            ->middleware('perm:platos.editar')
            ->name('platos.update');

        Route::delete('/menu/platos/{dish}', [DishController::class, 'destroy'])
            ->middleware('perm:platos.eliminar')
            ->name('platos.destroy');

        // ── Caja ─────────────────────────────────────────────────────────────
        Route::get('/caja',                    [OrderController::class, 'caja'])
            ->middleware('perm:caja.ver')
            ->name('caja');

        Route::post('/caja/{order}/cobrar',    [OrderController::class, 'cobrar'])
            ->middleware('perm:caja.gestionar')
            ->name('caja.cobrar');

        Route::post('/caja/{order}/pagar',     [OrderController::class, 'registrarPago'])
            ->middleware('perm:caja.gestionar')
            ->name('caja.pagar');

        // ── Pedidos ───────────────────────────────────────────────────────────
        Route::get('/pedidos',                  [OrderController::class, 'index'])
            ->middleware('perm:pedidos.ver')
            ->name('pedidos');

        Route::post('/pedidos/{order}/cancelar', [OrderController::class, 'cancelar'])
            ->middleware('perm:pedidos.cancelar')
            ->name('pedidos.cancelar');

        // ── Cocina ────────────────────────────────────────────────────────────
        Route::get('/cocina',                                    [CocinaController::class, 'index'])
            ->middleware('perm:cocina.ver')
            ->name('cocina');

        Route::post('/cocina/{order}/aceptar',                   [CocinaController::class, 'acceptOrder'])
            ->middleware('perm:cocina.gestionar')
            ->name('cocina.aceptar');

        Route::post('/cocina/{order}/cocinar',                   [CocinaController::class, 'startCooking'])
            ->middleware('perm:cocina.gestionar')
            ->name('cocina.cocinar');

        Route::post('/cocina/{order}/listo',                     [CocinaController::class, 'markReady'])
            ->middleware('perm:cocina.gestionar')
            ->name('cocina.listo');

        Route::post('/cocina/{order}/entregado',                 [CocinaController::class, 'markDelivered'])
            ->middleware('perm:mesa.gestionar')
            ->name('cocina.entregado');

        Route::get('/cocina/novedades',                          [CocinaController::class, 'novedades'])
            ->middleware('perm:novedades.ver')
            ->name('cocina.novedades');

        Route::post('/cocina/novedades',                         [CocinaController::class, 'storeNovedad'])
            ->middleware('perm:novedades.crear')
            ->name('cocina.novedades.store');

        Route::post('/cocina/novedades/{note}/verificar',        [CocinaController::class, 'verificarNovedad'])
            ->middleware('perm:novedades.gestionar')
            ->name('cocina.novedades.verificar');

        // ── Mesas ─────────────────────────────────────────────────────────────
        Route::get('/tables',           [TableController::class, 'index'])
            ->middleware('perm:mesa.ver')
            ->name('tables');

        Route::post('/tables',          [TableController::class, 'store'])
            ->middleware('perm:mesa.gestionar')
            ->name('tables.store');

        Route::put('/tables/{table}',   [TableController::class, 'update'])
            ->middleware('perm:mesa.gestionar')
            ->name('tables.update');

        Route::delete('/tables/{table}', [TableController::class, 'destroy'])
            ->middleware('perm:mesa.gestionar')
            ->name('tables.destroy');

        // ── Domicilio ─────────────────────────────────────────────────────────
        Route::get('/domicilio',                     [DomicilioController::class, 'index'])
            ->middleware('perm:domicilio.ver')
            ->name('domicilio');

        Route::put('/domicilio/{order}/asignar',     [DomicilioController::class, 'asignar'])
            ->middleware('perm:domicilio.gestionar')
            ->name('domicilio.asignar');

        Route::post('/domicilio/{order}/tomar',      [DomicilioController::class, 'tomar'])
            ->middleware('perm:domicilio.gestionar')
            ->name('domicilio.tomar');

        Route::post('/domicilio/{order}/entregar',   [DomicilioController::class, 'entregar'])
            ->middleware('perm:domicilio.gestionar')
            ->name('domicilio.entregar');

        // ── Inventario ────────────────────────────────────────────────────────
        Route::get('/inventario',                  [InventarioController::class, 'index'])
            ->middleware('perm:inventario.ver')
            ->name('inventario');

        Route::post('/inventario',                 [InventarioController::class, 'store'])
            ->middleware('perm:inventario.crear')
            ->name('inventario.store');

        Route::put('/inventario/{inventario}',     [InventarioController::class, 'update'])
            ->middleware('perm:inventario.editar')
            ->name('inventario.update');

        Route::delete('/inventario/{inventario}',  [InventarioController::class, 'destroy'])
            ->middleware('perm:inventario.eliminar')
            ->name('inventario.destroy');

        // ── Reporte ───────────────────────────────────────────────────────────
        Route::get('/reporte',          [ReporteController::class, 'index'])
            ->middleware('perm:reporte.ver')
            ->name('reporte');

        Route::get('/reporte/exportar', [ReporteController::class, 'exportar'])
            ->middleware('perm:reporte.ver')
            ->name('reporte.exportar');

        // ── Auditoría ─────────────────────────────────────────────────────────
        Route::get('/auditoria', [AuditController::class, 'index'])
            ->middleware('perm:auditoria.ver')
            ->name('auditoria');
    });
});
