<?php

namespace App\Http\Controllers;

use App\Models\Advertisement;
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

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total'     => $total,
                'activos'   => $activos,
                'inactivos' => $inactivos,
                'por_tipo'  => $porTipo,
                'por_plan'  => $porPlan,
            ],
            'lista'       => $lista,
            'crecimiento' => $crecimiento,
        ]);
    }

    public function billing()
    {
        $tenants = Tenant::all();
        $porPlan = $tenants->groupBy(fn($t) => $t->plan ?? 'basico')->map->count();

        $prices = ['basico' => 25000, 'pro' => 55000, 'enterprise' => 120000];
        $totalRevenue = $tenants->sum(fn($t) => $prices[$t->plan ?? 'basico'] ?? 25000);

        return Inertia::render('Admin/Billing', [
            'stats' => [
                'por_plan'      => $porPlan,
                'total_revenue' => $totalRevenue,
            ]
        ]);
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
