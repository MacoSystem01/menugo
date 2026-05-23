<?php

namespace App\Http\Controllers;

use App\Models\Advertisement;
use App\Models\PlatformPaymentMethod;
use App\Models\SliderLogo;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $tenants = Tenant::with('domains')->latest()->get();

        $total      = $tenants->count();
        $activos    = $tenants->filter(fn($t) => $t->active ?? true)->count();
        $inactivos  = $total - $activos;

        $porTipo = $tenants->groupBy(fn($t) => $t->type ?? 'otro')->map->count();
        $porPlan = $tenants->groupBy(fn($t) => $t->plan ?? 'basico')->map->count();

        $lista = $tenants->take(10)->map(fn($t) => [
            'id'        => $t->id,
            'name'      => $t->name,
            'type'      => $t->type ?? 'restaurante',
            'plan'      => $t->plan ?? '—',
            'active'    => $t->active ?? true,
            'subdomain' => $t->domains->first()?->domain,
            'created_at'=> $t->created_at?->format('d/m/Y'),
        ]);

        $crecimiento = Tenant::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, count(*) as count')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Tenants pendientes de activación (registro nuevo, pago no confirmado)
        $pendingPayments = Tenant::with('domains')
            ->whereIn('payment_status', ['pending_payment', 'pending_review'])
            ->where('active', false)
            ->latest()
            ->get()
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
        $tenants = Tenant::all();
        $porPlan = $tenants->groupBy(fn($t) => $t->plan ?? 'basico')->map->count();

        $prices = ['mensual' => 30000, 'trimestral' => 80000, 'semestral' => 220000, 'anual' => 350000];
        $totalRevenue = $tenants->where('payment_status', 'active')->sum(fn($t) => $prices[$t->plan ?? 'mensual'] ?? 30000);

        $pendingTenants = Tenant::with('domains')
            ->whereIn('payment_status', ['pending_payment', 'pending_review'])
            ->latest()
            ->get()
            ->map(fn($t) => [
                'id'                    => $t->id,
                'name'                  => $t->name,
                'email'                 => $t->email,
                'plan'                  => $t->plan,
                'payment_status'        => $t->payment_status,
                'payment_evidence_path' => $t->payment_evidence_path
                    ? Storage::disk('public')->url($t->payment_evidence_path)
                    : null,
                'payment_evidence_at'   => $t->payment_evidence_at,
                'subdomain'             => $t->domains->first()?->domain,
                'created_at'            => $t->created_at->format('d/m/Y H:i'),
            ]);

        $paymentMethods = PlatformPaymentMethod::orderBy('sort_order')->orderBy('id')->get();

        return Inertia::render('Admin/Billing', [
            'stats' => [
                'por_plan'      => $porPlan,
                'total_revenue' => $totalRevenue,
            ],
            'pendingTenants' => $pendingTenants,
            'paymentMethods' => $paymentMethods,
        ]);
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

        return Inertia::render('Admin/Publicidad', ['ads' => $ads->values()]);
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

        return Inertia::render('Admin/PublicidadSlider', ['logos' => $logos->values()]);
    }

    public function storeSliderLogo(Request $request)
    {
        $request->validate([
            'image'         => 'required|image|mimes:jpg,jpeg,png,webp,svg|max:2048',
            'business_name' => 'nullable|string|max:120',
        ]);

        $path     = $request->file('image')->store('slider-logos', 'public');
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
}
