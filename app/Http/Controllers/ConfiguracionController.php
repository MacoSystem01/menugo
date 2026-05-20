<?php

namespace App\Http\Controllers;

use App\Models\CartaSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConfiguracionController extends Controller
{
    private function settings(): CartaSetting
    {
        return CartaSetting::firstOrCreate([]);
    }

    // ── Métodos de pago ───────────────────────────────────────────────────────

    public function pagos()
    {
        $settings = $this->settings();

        return Inertia::render('Configuraciones/Pagos', [
            'metodosActivos' => $settings->payment_methods ?? ['efectivo'],
            'detalles'       => $settings->payment_details ?? [],
        ]);
    }

    public function guardarPagos(Request $request)
    {
        $request->validate([
            'metodos'                      => 'required|array|min:1',
            'metodos.*'                    => 'required|string|in:efectivo,tarjeta,nequi,daviplata,pse,transferencia',
            'detalles'                     => 'nullable|array',
            'detalles.*.titular'           => 'nullable|string|max:120',
            'detalles.*.numero'            => 'nullable|string|max:60',
            'detalles.*.tipo_cuenta'       => 'nullable|string|in:ahorros,corriente,',
            'detalles.*.banco'             => 'nullable|string|max:80',
            'detalles.*.nota'              => 'nullable|string|max:200',
        ]);

        $metodos = array_unique(array_merge(['efectivo'], $request->metodos));

        $this->settings()->update([
            'payment_methods' => array_values($metodos),
            'payment_details' => $request->detalles ?? [],
        ]);

        return back()->with('success', 'Métodos de pago actualizados correctamente.');
    }

    // ── Tarifas de domicilio ──────────────────────────────────────────────────

    public function domicilio()
    {
        $settings = $this->settings();

        return Inertia::render('Configuraciones/Domicilio', [
            'delivery_enabled'   => (bool) ($settings->delivery_enabled   ?? false),
            'delivery_min_order' => (int)  ($settings->delivery_min_order ?? 0),
            'delivery_zones'     => $settings->delivery_zones ?? [],
        ]);
    }

    public function guardarDomicilio(Request $request)
    {
        $request->validate([
            'delivery_enabled'           => 'boolean',
            'delivery_min_order'         => 'nullable|integer|min:0',
            'delivery_zones'             => 'present|array|max:20',
            'delivery_zones.*.label'     => 'required|string|max:60',
            'delivery_zones.*.min_km'    => 'required|numeric|min:0',
            'delivery_zones.*.max_km'    => 'required|numeric',
            'delivery_zones.*.price'     => 'required|integer|min:0',
        ]);

        $this->settings()->update([
            'delivery_enabled'   => $request->boolean('delivery_enabled'),
            'delivery_min_order' => (int) ($request->delivery_min_order ?? 0),
            'delivery_zones'     => $request->delivery_zones ?? [],
        ]);

        return back()->with('success', 'Configuración de domicilio actualizada correctamente.');
    }
}
