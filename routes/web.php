<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdvertisingController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TenantController;
use App\Models\Advertisement;
use App\Models\SliderLogo;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ── Públicas (dominio central Menugo.local) ───────────────────────────────────
Route::get('/', function () {
    try {
        // Usar el accessor image_url del modelo (Advertisement::getImageUrlAttribute)
        // evita duplicar la lógica de Storage::disk('public')->url() y resuelve el
        // falso positivo del IDE con url() en la interfaz Filesystem.
        $ads = Advertisement::where('active', true)->orderBy('sort_order')->orderBy('id')->get()->map(fn($a) => [
            'image_url' => $a->image_url,
            'title'     => $a->title,
            'url'       => $a->url,
        ])->values();
    } catch (\Exception) {
        $ads = collect([]);
    }

    try {
        // Usar el accessor image_url del modelo (SliderLogo::getImageUrlAttribute)
        $sliderLogos = SliderLogo::where('active', true)->orderBy('sort_order')->orderBy('id')->get()->map(fn($s) => [
            'image_url'     => $s->image_url,
            'business_name' => $s->business_name,
        ])->values();
    } catch (\Exception) {
        $sliderLogos = collect([]);
    }

    return Inertia::render('Welcome', [
        'heroSlots' => $ads,
        'partnerLogos' => $sliderLogos,
    ]);
});
Route::get('/welcome', fn() => Inertia::render('Welcome', ['heroSlots' => [], 'partnerLogos' => []]));
Route::get('/pricing',          fn() => Inertia::render('Pricing'));
Route::get('/register',         fn() => Inertia::render('Auth/Register'));
Route::get('/register/success', [TenantController::class, 'registerSuccess'])->name('register.success');
Route::post('/register',        [TenantController::class, 'publicRegister'])->name('tenant.register');
Route::get('/tenant/find',      [TenantController::class, 'find'])->name('tenant.find');

// ── Auth SuperAdmin (URL configurada en .env → ADMIN_LOGIN_PATH) ──────────────
// config() funciona correctamente con php artisan config:cache; env() no.
$adminPath = config('app.admin_login_path', env('ADMIN_LOGIN_PATH', 'sistema/acceso-control'));

Route::middleware('guest')->group(function () use ($adminPath) {
    Route::get("/{$adminPath}",  [AuthController::class, 'showAdminLogin'])->name('admin.login');
    Route::post("/{$adminPath}", [AuthController::class, 'adminLogin'])->middleware('throttle:5,1');
});

// Sin restricción de dominio ni auth middleware — funciona para el dominio central,
// subdominios tenant y localhost. El controlador maneja el contexto correctamente.
Route::post('/logout', [AuthController::class, 'logout'])->middleware('throttle:20,1')->name('logout');

// ── API pública — métodos de pago (sin auth, usada en /register) ─────────────
// throttle:30,1 → máx 30 req/min por IP (suficiente para el formulario de registro)
Route::get('/api/payment-methods', [AdminDashboardController::class, 'apiPaymentMethods'])
    ->middleware('throttle:30,1')
    ->name('api.payment-methods');

// ── API pública — publicidad (modal en landing) ───────────────────────────────
// throttle:30,1 → protege contra scraping de subdominios registrados
Route::get('/api/tenants/search', [AdvertisingController::class, 'searchTenants'])
    ->middleware('throttle:30,1')
    ->name('api.tenants.search');

// Verificar que el email pertenece a un Gerente/Admin del tenant
Route::post('/api/advertising/verify-identity', [AdvertisingController::class, 'verifyIdentity'])
    ->name('advertising.verify-identity')
    ->middleware('throttle:20,1');

Route::post('/api/advertising/request', [AdvertisingController::class, 'store'])
    ->name('advertising.store')
    ->middleware('throttle:10,5');

// ── Panel SuperAdmin ──────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:administrador'])->prefix('admin')->group(function () {
    Route::get('/',                      [AdminDashboardController::class, 'index']);

    // ── Health Check del sistema (alertas en tiempo real) ─────────────────────
    Route::get('/system-health', [AdminDashboardController::class, 'systemHealth'])
        ->name('admin.system-health')
        ->middleware('throttle:30,1');
    Route::post('/clear-log', [AdminDashboardController::class, 'clearLog'])
        ->name('admin.clear-log')
        ->middleware('throttle:5,1');
    Route::get('/tenants',               [TenantController::class, 'index'])->name('admin.tenants');
    Route::post('/tenants',              [TenantController::class, 'store'])->name('admin.tenants.store');
    Route::put('/tenants/{id}',          [TenantController::class, 'update'])->name('admin.tenants.update');
    Route::patch('/tenants/{id}/status', [TenantController::class, 'toggleStatus'])->name('admin.tenants.toggle');
    Route::patch('/tenants/{id}/activate', [TenantController::class, 'activateTenant'])->name('admin.tenants.activate');
    Route::delete('/tenants/{id}',       [TenantController::class, 'destroy'])->name('admin.tenants.destroy');
    Route::get('/billing',               [AdminDashboardController::class, 'billing'])->name('admin.billing');

    // Métodos de pago de la plataforma
    Route::post('/payment-methods',                       [AdminDashboardController::class, 'storePaymentMethod'])->name('admin.payment-methods.store');
    Route::put('/payment-methods/{id}',                   [AdminDashboardController::class, 'updatePaymentMethod'])->name('admin.payment-methods.update');
    Route::patch('/payment-methods/{id}/toggle',          [AdminDashboardController::class, 'togglePaymentMethod'])->name('admin.payment-methods.toggle');
    Route::delete('/payment-methods/{id}',                [AdminDashboardController::class, 'destroyPaymentMethod'])->name('admin.payment-methods.destroy');

    // Publicidad MockUp
    Route::get('/publicidad',                          [AdminDashboardController::class, 'publicidad'])->name('admin.publicidad');
    Route::post('/publicidad',                         [AdminDashboardController::class, 'storeAnuncio'])->name('admin.publicidad.store');
    Route::patch('/publicidad/{advertisement}/toggle', [AdminDashboardController::class, 'toggleAnuncio'])->name('admin.publicidad.toggle');
    Route::delete('/publicidad/{advertisement}',       [AdminDashboardController::class, 'deleteAnuncio'])->name('admin.publicidad.delete');

    // Publicidad Slider
    Route::get('/publicidad-slider',                         [AdminDashboardController::class, 'publicidadSlider'])->name('admin.publicidad-slider');
    Route::post('/publicidad-slider',                        [AdminDashboardController::class, 'storeSliderLogo'])->name('admin.publicidad-slider.store');
    Route::patch('/publicidad-slider/{sliderLogo}/toggle',   [AdminDashboardController::class, 'toggleSliderLogo'])->name('admin.publicidad-slider.toggle');
    Route::delete('/publicidad-slider/{sliderLogo}',         [AdminDashboardController::class, 'deleteSliderLogo'])->name('admin.publicidad-slider.delete');

    // Solicitudes publicitarias — acciones del administrador
    Route::patch('/ad-requests/{id}/approve', [AdminDashboardController::class, 'approveAdRequest'])->name('admin.ad-requests.approve');
    Route::patch('/ad-requests/{id}/reject',  [AdminDashboardController::class, 'rejectAdRequest'])->name('admin.ad-requests.reject');
});
