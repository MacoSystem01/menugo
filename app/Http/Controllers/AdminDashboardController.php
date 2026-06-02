<?php

namespace App\Http\Controllers;

use App\Mail\AdRequestApproved;
use App\Models\Advertisement;
use App\Models\AdvertisingRequest;
use App\Models\PlatformPaymentMethod;
use App\Models\SliderLogo;
use App\Models\Tenant;
use App\Services\LogoProcessor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // ── Stats globales: conteos directos en BD (no cargar todos los registros) ──
        $total     = Tenant::withoutTrashed()->count();

        // 'active' vive en JSON data → contar en PHP sólo con los que filtramos
        // Para stats no necesitamos cargar TODOS los tenants; usar conteo approx con JSON_EXTRACT
        $activos   = Tenant::withoutTrashed()
            ->whereRaw("JSON_EXTRACT(`data`, '$.active') = true")
            ->count();
        $inactivos = $total - $activos;

        // Distribución por tipo y plan: sólo columnas reales (index disponible)
        $porTipo = Tenant::withoutTrashed()
            ->selectRaw("JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.type')) as tipo, count(*) as total")
            ->groupBy('tipo')
            ->pluck('total', 'tipo')
            ->toArray();

        $porPlan = Tenant::withoutTrashed()
            ->selectRaw('plan, count(*) as total')
            ->groupBy('plan')
            ->pluck('total', 'plan')
            ->toArray();

        // ── Lista reciente: sólo los últimos 20 (no cargar todos) ────────────
        $lista = Tenant::with('domains')
            ->withoutTrashed()
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn($t) => [
                'id'         => $t->id,
                'name'       => $t->name,
                'type'       => $t->type ?? 'restaurante',
                'plan'       => $t->plan ?? '—',
                'active'     => $t->active ?? true,
                'subdomain'  => $t->domains->first()?->domain,
                'created_at' => $t->created_at?->format('d/m/Y'),
            ]);

        // ── Crecimiento mensual: últimos 12 meses ─────────────────────────────
        $crecimiento = Tenant::withoutTrashed()
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, count(*) as count')
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // ── Pagos pendientes ──────────────────────────────────────────────────
        $pendingPayments = Tenant::with('domains')
            ->withoutTrashed()
            ->whereIn('payment_status', ['pending_payment', 'pending_review'])
            ->latest()
            ->get()
            ->filter(fn($t) => !($t->active ?? true))
            ->values()
            ->map(fn($t) => [
                'id'             => $t->id,
                'name'           => $t->name,
                'owner_name'     => $t->owner_name,
                'email'          => $t->email,
                'plan'           => $t->plan,
                'payment_status' => $t->payment_status,
                'has_evidence'   => !is_null($t->payment_evidence_path),
                'subdomain'      => $t->domains->first()?->domain,
                'created_at'     => $t->created_at?->format('d/m/Y H:i'),
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total'     => $total,
                'activos'   => $activos,
                'inactivos' => $inactivos,
                'por_tipo'  => $porTipo,
                'por_plan'  => $porPlan,
            ],
            'lista'           => $lista,
            'crecimiento'     => $crecimiento,
            'pendingPayments' => $pendingPayments,
        ]);
    }

    public function billing()
    {
        // withTrashed() para conservar historial de cuentas eliminadas
        // with('domains') reutilizado para todas las consultas derivadas
        $tenants = Tenant::withTrashed()->with('domains')->latest()->get();

        $porPlan = $tenants->whereNull('deleted_at')->groupBy(fn($t) => $t->plan ?? 'basico')->map->count();

        $prices = [
            'starter'    => 0,
            'basico'     => 34900,
            'trimestral' => 83900,
            'semestral'  => 146900,
            'anual'      => 230900,
            'mensual'    => 34900, // legacy
        ];

        $monthlyEquivalent = [
            'starter'    => 0,
            'basico'     => 34900,
            'trimestral' => 27967,  // 83900 / 3
            'semestral'  => 24483,  // 146900 / 6
            'anual'      => 19242,  // 230900 / 12
            'mensual'    => 34900,  // legacy
        ];

        $paidTenants  = $tenants->where('payment_status', 'paid')->whereNull('deleted_at');
        $totalRevenue = $paidTenants->sum(fn($t) => $prices[$t->plan ?? 'basico'] ?? 34900);
        $totalMonthly = $paidTenants->sum(fn($t) => $monthlyEquivalent[$t->plan ?? 'basico'] ?? 34900);

        $pendingTenants = $tenants
            ->whereNull('deleted_at')
            ->whereIn('payment_status', ['pending_payment', 'pending_review'])
            ->values()
            ->map(fn($t) => [
                'id'                    => $t->id,
                'name'                  => $t->name,
                'email'                 => $t->email,
                'plan'                  => $t->plan,
                'payment_status'        => $t->payment_status,
                'deleted_at'            => $t->deleted_at?->format('d/m/Y H:i'),
                'payment_evidence_path' => $t->payment_evidence_path
                    ? Storage::disk('public')->url($t->payment_evidence_path)
                    : null,
                'subdomain'             => $t->domains->first()?->domain,
                'created_at'            => $t->created_at->format('d/m/Y H:i'),
            ]);

        $paymentMethods = PlatformPaymentMethod::orderBy('sort_order')->orderBy('id')->get();

        // ── Historial de cuentas ──────────────────────────────────────────────────
        $mapHistory = fn($t) => [
            'id'             => $t->id,
            'name'           => $t->name,
            'email'          => $t->email,
            'plan'           => $t->plan ?? '—',
            'payment_status' => $t->payment_status,
            'subdomain'      => $t->domains->first()?->domain,
            'created_at'     => $t->created_at?->format('d/m/Y'),
            'deleted_at'     => $t->deleted_at?->format('d/m/Y'),
        ];

        // FIX: 'active' no es un payment_status válido — corregido a 'paid'
        $historyActivas = $tenants
            ->whereNull('deleted_at')
            ->where('payment_status', 'paid')
            ->values()
            ->map($mapHistory);

        // FIX: 'active' → 'paid' (valor correcto). Inactivas = todo lo que no sea paid ni pendiente
        $historyInactivas = $tenants
            ->whereNull('deleted_at')
            ->filter(fn($t) => !in_array($t->payment_status ?? '', ['paid', 'pending_payment', 'pending_review']))
            ->values()
            ->map($mapHistory);

        $historyEliminadas = $tenants
            ->whereNotNull('deleted_at')
            ->values()
            ->map($mapHistory);

        // ── Solicitudes publicitarias pendientes para el Reporte de Billing ─────
        $adRequestsBanner = $this->pendingAdRequests(['banner', 'combo']);
        $adRequestsSlider = $this->pendingAdRequests(['slider', 'combo']);

        return Inertia::render('Admin/Billing', [
            'stats' => [
                'por_plan'      => $porPlan,
                'total_revenue' => $totalRevenue,
                'total_monthly' => $totalMonthly,
            ],
            'pendingTenants'   => $pendingTenants,
            'paymentMethods'   => $paymentMethods,
            'adRequestsBanner' => $adRequestsBanner->values(),
            'adRequestsSlider' => $adRequestsSlider->values(),
            'tenantHistory'    => [
                'activas'    => $historyActivas->values(),
                'inactivas'  => $historyInactivas->values(),
                'eliminadas' => $historyEliminadas->values(),
            ],
        ]);
    }

    // ── API: Health Check del sistema para alertas en tiempo real ─────────────
    //    Endpoint: GET /admin/system-health
    //    Accesible sólo para role:administrador (middleware de la ruta)
    //    Usado por el componente SystemAlertBanner para notificaciones emergentes
    //    throttle:30,1 — máx 30 checks/min por IP (el banner hace polling cada 90s)

    public function systemHealth(): \Illuminate\Http\JsonResponse
    {
        $alerts = [];

        // ── 1. Tenants pendientes de revisión ─────────────────────────────────
        try {
            $pendingCount = \App\Models\Tenant::withoutTrashed()
                ->whereIn('payment_status', ['pending_payment', 'pending_review'])
                ->whereRaw("(JSON_EXTRACT(`data`, '$.active') IS NULL OR JSON_EXTRACT(`data`, '$.active') = false)")
                ->count();

            if ($pendingCount > 0) {
                $alerts[] = [
                    'type'    => 'warning',
                    'icon'    => 'clock',
                    'title'   => "{$pendingCount} restaurante(s) pendientes de activación",
                    'message' => 'Hay solicitudes de pago sin revisar. Ve a Facturación para aprobarlas.',
                    'action'  => ['label' => 'Ver Facturación', 'url' => '/admin/billing'],
                ];
            }
        } catch (\Throwable) {
        }

        // ── 2. Cola de jobs acumulada ─────────────────────────────────────────
        try {
            $pendingJobs = \DB::connection('mysql')->table('jobs')->count();
            if ($pendingJobs > 50) {
                $alerts[] = [
                    'type'    => 'danger',
                    'icon'    => 'alert-triangle',
                    'title'   => "Cola de trabajos saturada ({$pendingJobs} jobs)",
                    'message' => 'El sistema tiene demasiados trabajos pendientes. Verifica que el worker de colas esté corriendo: php artisan queue:work',
                    'action'  => null,
                ];
            } elseif ($pendingJobs > 20) {
                $alerts[] = [
                    'type'    => 'warning',
                    'icon'    => 'alert-triangle',
                    'title'   => "Cola con {$pendingJobs} trabajos pendientes",
                    'message' => 'La cola está creciendo. Asegúrate de que el worker esté activo: php artisan queue:work',
                    'action'  => null,
                ];
            }
        } catch (\Throwable) {
            // La tabla jobs puede no existir en algunos entornos
        }

        // ── 3. Jobs fallidos ──────────────────────────────────────────────────
        try {
            $failedJobs = \DB::connection('mysql')->table('failed_jobs')->count();
            if ($failedJobs > 0) {
                $alerts[] = [
                    'type'    => 'danger',
                    'icon'    => 'x-circle',
                    'title'   => "{$failedJobs} job(s) fallido(s) en cola",
                    'message' => 'Algunos trabajos en segundo plano fallaron. Ejecuta: php artisan queue:retry all',
                    'action'  => null,
                ];
            }
        } catch (\Throwable) {
        }

        // ── 4. Espacio en disco ───────────────────────────────────────────────
        try {
            $free  = disk_free_space(storage_path());
            $total = disk_total_space(storage_path());
            if ($total > 0) {
                $usedPct  = round((($total - $free) / $total) * 100, 1);
                $freeGb   = round($free / 1024 / 1024 / 1024, 1);
                if ($usedPct >= 95) {
                    $alerts[] = [
                        'type'    => 'danger',
                        'icon'    => 'hard-drive',
                        'title'   => "Disco crítico: {$usedPct}% usado ({$freeGb} GB libres)",
                        'message' => 'El servidor está casi sin espacio. Elimina archivos temporales, logs y backups antiguos urgentemente.',
                        'action'  => null,
                    ];
                } elseif ($usedPct >= 85) {
                    $alerts[] = [
                        'type'    => 'warning',
                        'icon'    => 'hard-drive',
                        'title'   => "Disco al {$usedPct}% — quedan {$freeGb} GB libres",
                        'message' => 'El almacenamiento del servidor está alto. Considera liberar espacio pronto.',
                        'action'  => null,
                    ];
                }
            }
        } catch (\Throwable) {
        }

        // ── 5. Muchos tenants sin activar (crecimiento detenido) ─────────────
        try {
            $totalTenants  = \App\Models\Tenant::withoutTrashed()->count();
            $activeTenants = \App\Models\Tenant::withoutTrashed()
                ->whereRaw("JSON_EXTRACT(`data`, '$.active') = true")
                ->count();

            if ($totalTenants > 10 && $activeTenants < ($totalTenants * 0.5)) {
                $inactivePct = round((1 - $activeTenants / $totalTenants) * 100);
                $alerts[] = [
                    'type'    => 'warning',
                    'icon'    => 'trending-down',
                    'title'   => "{$inactivePct}% de restaurantes inactivos",
                    'message' => "De {$totalTenants} registrados, solo {$activeTenants} están activos. Revisa el proceso de activación.",
                    'action'  => ['label' => 'Ver Tenants', 'url' => '/admin/tenants'],
                ];
            }
        } catch (\Throwable) {
        }

        // ── 6. Solicitudes publicitarias pendientes ───────────────────────────
        try {
            $adRequests = \App\Models\AdvertisingRequest::whereIn('status', ['pending_payment', 'pending_review'])->count();
            if ($adRequests > 0) {
                $alerts[] = [
                    'type'    => 'info',
                    'icon'    => 'megaphone',
                    'title'   => "{$adRequests} solicitud(es) publicitaria(s) pendiente(s)",
                    'message' => 'Hay solicitudes de publicidad sin aprobar/rechazar.',
                    'action'  => ['label' => 'Ver Publicidad', 'url' => '/admin/publicidad'],
                ];
            }
        } catch (\Throwable) {
        }

        // ── 7. Log de errores recientes ───────────────────────────────────────
        try {
            $logFile = storage_path('logs/laravel.log');
            if (file_exists($logFile)) {
                $logSize = filesize($logFile);
                $oneMb   = 1024 * 1024;
                if ($logSize > 50 * $oneMb) {
                    $sizeMb = round($logSize / $oneMb, 1);
                    $alerts[] = [
                        'type'    => 'warning',
                        'icon'    => 'hard-drive',
                        'title'   => "Archivo de log grande: {$sizeMb} MB",
                        'message' => 'El log de errores está ocupando mucho espacio. Puedes limpiarlo ahora sin afectar el sistema.',
                        'action'  => ['label' => 'Limpiar ahora', 'url' => '/admin/clear-log', 'method' => 'POST'],
                    ];
                }
            }
        } catch (\Throwable) {
        }

        // ── 8. APP_DEBUG activo en producción ─────────────────────────────────
        if (app()->isProduction() && config('app.debug')) {
            $alerts[] = [
                'type'    => 'danger',
                'icon'    => 'alert-triangle',
                'title'   => "APP_DEBUG está habilitado en producción",
                'message' => 'DEBUG=true expone trazas de error completas. Cambia APP_DEBUG=false en .env y ejecuta php artisan config:cache.',
                'action'  => null,
            ];
        }

        return response()->json([
            'alerts'       => $alerts,
            'checked_at'   => now()->format('H:i:s'),
            'total_alerts' => count($alerts),
        ]);
    }

    public function clearLog()
    {
        $logFile = storage_path('logs/laravel.log');
        if (file_exists($logFile)) {
            file_put_contents($logFile, '');
        }
        return response()->json(['ok' => true]);
    }

    // ── API pública: métodos de pago activos (usados en /register) ────────────

    public function apiPaymentMethods()
    {
        $methods = PlatformPaymentMethod::active()->get(['id', 'name', 'account_info', 'instructions']);
        return response()->json($methods);
    }

    // ── CRUD métodos de pago de la plataforma ─────────────────────────────────

    public function storePaymentMethod(Request $request)
    {
        $request->validate([
            'name'         => 'required|string|max:100',
            'account_info' => 'required|string|max:255',
            'instructions' => 'nullable|string|max:500',
        ]);

        $maxOrder = PlatformPaymentMethod::max('sort_order') ?? 0;
        PlatformPaymentMethod::create([
            'name'         => $request->name,
            'account_info' => $request->account_info,
            'instructions' => $request->instructions,
            'active'       => true,
            'sort_order'   => $maxOrder + 1,
        ]);

        return back()->with('success', "Método de pago '{$request->name}' agregado.");
    }

    public function updatePaymentMethod(Request $request, int $id)
    {
        $method = PlatformPaymentMethod::findOrFail($id);
        $request->validate([
            'name'         => 'required|string|max:100',
            'account_info' => 'required|string|max:255',
            'instructions' => 'nullable|string|max:500',
        ]);
        $method->update($request->only('name', 'account_info', 'instructions'));
        return back()->with('success', 'Método de pago actualizado.');
    }

    public function destroyPaymentMethod(int $id)
    {
        PlatformPaymentMethod::findOrFail($id)->delete();
        return back()->with('success', 'Método de pago eliminado.');
    }

    public function togglePaymentMethod(int $id)
    {
        $method = PlatformPaymentMethod::findOrFail($id);
        $method->update(['active' => ! $method->active]);
        return back()->with('success', $method->active ? 'Método activado.' : 'Método desactivado.');
    }

    // ── Publicidad ────────────────────────────────────────────────────────────────

    public function publicidad()
    {
        $ads = Advertisement::orderBy('sort_order')->orderBy('id')->get()->map(fn($a) => [
            'id'         => $a->id,
            'image_url'  => $a->image_url,
            'title'      => $a->title,
            'url'        => $a->url,
            'sort_order' => $a->sort_order,
            'active'     => $a->active,
        ]);

        // Banner: solo pendientes de acción (published/rejected ya no requieren gestión)
        $adRequests = $this->pendingAdRequests(['banner', 'combo']);

        return Inertia::render('Admin/Publicidad', [
            'ads'        => $ads->values(),
            'adRequests' => $adRequests->values(),
        ]);
    }

    public function storeAnuncio(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
            'title' => 'nullable|string|max:120',
            'url'   => 'nullable|url|max:255',
        ]);

        $path     = $request->file('image')->store('advertisements', 'public');
        $maxOrder = Advertisement::max('sort_order') ?? 0;

        Advertisement::create([
            'image_path' => $path,
            'title'      => $request->title,
            'url'        => $request->url,
            'sort_order' => $maxOrder + 1,
            'active'     => true,
        ]);

        return back()->with('success', 'Anuncio publicado correctamente.');
    }

    public function toggleAnuncio(Advertisement $advertisement)
    {
        $advertisement->update(['active' => ! $advertisement->active]);
        return back()->with('success', $advertisement->active ? 'Anuncio activado.' : 'Anuncio desactivado.');
    }

    public function deleteAnuncio(Advertisement $advertisement)
    {
        Storage::disk('public')->delete($advertisement->image_path);
        $advertisement->delete();
        return back()->with('success', 'Anuncio eliminado correctamente.');
    }

    // ── Publicidad Slider ─────────────────────────────────────────────────────────

    public function publicidadSlider()
    {
        $logos = SliderLogo::orderBy('sort_order')->orderBy('id')->get()->map(fn($s) => [
            'id'            => $s->id,
            'image_url'     => $s->image_url,
            'business_name' => $s->business_name,
            'sort_order'    => $s->sort_order,
            'active'        => $s->active,
        ]);

        // Slider: solo pendientes de acción (published/rejected ya no requieren gestión)
        $adRequests = $this->pendingAdRequests(['slider', 'combo']);

        return Inertia::render('Admin/PublicidadSlider', [
            'logos'      => $logos->values(),
            'adRequests' => $adRequests->values(),
        ]);
    }

    public function storeSliderLogo(Request $request)
    {
        $request->validate([
            'image'         => 'required|image|mimes:jpg,jpeg,png,webp,svg|max:2048',
            'business_name' => 'nullable|string|max:120',
        ]);

        $path = $request->file('image')->store('slider-logos', 'public');

        // GD no soporta SVG — solo procesar formatos raster
        if (strtolower($request->file('image')->getClientOriginalExtension()) !== 'svg') {
            try {
                $path = LogoProcessor::processInPlace($path, false);
            } catch (\Throwable $e) {
                // Si el procesado falla, continuar con el archivo original sin transformar
                logger()->warning("LogoProcessor::processInPlace failed for [{$path}]: " . $e->getMessage());
            }
        }

        $maxOrder = SliderLogo::max('sort_order') ?? 0;

        SliderLogo::create([
            'image_path'    => $path,
            'business_name' => $request->business_name,
            'sort_order'    => $maxOrder + 1,
            'active'        => true,
        ]);

        return back()->with('success', 'Logo publicado correctamente.');
    }

    public function toggleSliderLogo(SliderLogo $sliderLogo)
    {
        $sliderLogo->update(['active' => ! $sliderLogo->active]);
        return back()->with('success', $sliderLogo->active ? 'Logo activado.' : 'Logo desactivado.');
    }

    public function deleteSliderLogo(SliderLogo $sliderLogo)
    {
        Storage::disk('public')->delete($sliderLogo->image_path);
        $sliderLogo->delete();
        return back()->with('success', 'Logo eliminado correctamente.');
    }

    // ── Solicitudes publicitarias — acciones del administrador ───────────────────

    /** Aprobar (publicar) una solicitud publicitaria.
     *  Crea las entradas en advertisements y/o slider_logos según el tipo,
     *  usando el mismo image_path para no duplicar el archivo en disco.
     */
    public function approveAdRequest(int $id): \Illuminate\Http\RedirectResponse
    {
        $adRequest = AdvertisingRequest::findOrFail($id);

        if ($adRequest->status === 'active') {
            return back()->with('success', "Solicitud #{$id} ya estaba activa.");
        }

        $updates = ['status' => 'active', 'activated_at' => now()];

        // ── Banner / Combo → crear Advertisement ────────────────────────────
        if (in_array($adRequest->type, ['banner', 'combo']) && ! $adRequest->advertisement_id) {
            $ad = Advertisement::create([
                'image_path' => $adRequest->image_path,
                'title'      => $adRequest->business_name,
                'url'        => null,
                'sort_order' => (Advertisement::max('sort_order') ?? 0) + 1,
                'active'     => true,
            ]);
            $updates['advertisement_id'] = $ad->id;
        }

        // ── Slider / Combo → crear SliderLogo (con procesado de imagen) ─────
        if (in_array($adRequest->type, ['slider', 'combo']) && ! $adRequest->slider_logo_id) {
            // Intentar procesar la imagen; si GD falla, usar el original
            try {
                $logoPath = LogoProcessor::processForSlider(
                    $adRequest->image_path,
                    (bool) $adRequest->ai_enhanced
                );
            } catch (\Throwable $e) {
                logger()->warning("LogoProcessor::processForSlider failed for ad_request #{$id}: " . $e->getMessage());
                $logoPath = $adRequest->image_path;
            }
            $logo = SliderLogo::create([
                'image_path'    => $logoPath,
                'business_name' => $adRequest->business_name,
                'sort_order'    => (SliderLogo::max('sort_order') ?? 0) + 1,
                'active'        => true,
            ]);
            $updates['slider_logo_id'] = $logo->id;
        }

        $adRequest->update($updates);

        // ── Notificar al contacto por email ──────────────────────────────────
        if ($adRequest->contact_email) {
            try {
                Mail::to($adRequest->contact_email)
                    ->send(new AdRequestApproved($adRequest));
            } catch (\Throwable $e) {
                // El error de correo no debe impedir la respuesta al admin
                logger()->warning("AdRequestApproved mail failed for #{$id}: " . $e->getMessage());
            }
        }

        $emailNote = $adRequest->contact_email
            ? " Se notificó a {$adRequest->contact_email}."
            : '';

        return back()->with('success', "Solicitud #{$id} publicada y activada.{$emailNote}");
    }

    /** Rechazar (cancelar) una solicitud publicitaria con motivo.
     *  Desactiva las entradas de advertisements/slider_logos vinculadas (sin borrarlas).
     */
    public function rejectAdRequest(Request $request, int $id): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'reason' => 'required|string|max:600',
        ]);

        $adRequest = AdvertisingRequest::findOrFail($id);

        // Desactivar entradas publicadas si existían
        if ($adRequest->advertisement_id) {
            Advertisement::find($adRequest->advertisement_id)?->update(['active' => false]);
        }
        if ($adRequest->slider_logo_id) {
            SliderLogo::find($adRequest->slider_logo_id)?->update(['active' => false]);
        }

        $adRequest->update([
            'status'      => 'rejected',
            'admin_notes' => $request->reason,
        ]);

        return back()->with('success', "Solicitud #{$id} cancelada. El motivo quedó registrado.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────────

    /**
     * Devuelve las solicitudes publicitarias pendientes (pending_payment / pending_review)
     * para los tipos indicados, ya mapeadas para Inertia.
     *
     * @param  string[] $types  Ej: ['banner','combo'] o ['slider','combo']
     * @return \Illuminate\Support\Collection
     */
    private function pendingAdRequests(array $types): \Illuminate\Support\Collection
    {
        return AdvertisingRequest::latest()
            ->whereIn('type', $types)
            ->whereIn('status', ['pending_payment', 'pending_review'])
            ->get()
            ->map(fn($r) => $this->mapAdRequest($r));
    }

    /** Serializa una AdvertisingRequest para Inertia (mismo contrato en todas las vistas) */
    private function mapAdRequest(AdvertisingRequest $r): array
    {
        return [
            'id'               => $r->id,
            'type'             => $r->type,
            'business_name'    => $r->business_name,
            'contact_name'     => $r->contact_name,
            'contact_email'    => $r->contact_email,
            'contact_phone'    => $r->contact_phone,
            'image_url'        => $r->image_url,
            'proof_url'        => $r->proof_url,
            'ai_enhanced'      => $r->ai_enhanced,
            'status'           => $r->status,
            'admin_notes'      => $r->admin_notes,
            'created_at'       => $r->created_at?->format('d/m/Y H:i'),
            'payment_proof_at' => $r->payment_proof_at?->format('d/m/Y H:i'),
        ];
    }
}
