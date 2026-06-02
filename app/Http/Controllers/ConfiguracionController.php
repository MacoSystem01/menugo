<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\CartaSetting;
use App\Models\DailyClosing;
use App\Models\Order;
use App\Models\RestaurantTable;
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
            'detalles.*.link'              => 'nullable|url|max:500',
            'detalles.*.tipo_cuenta'       => 'nullable|string|in:ahorros,corriente,',
            'detalles.*.banco'             => 'nullable|string|max:80',
            'detalles.*.nota'              => 'nullable|string|max:200',
        ]);

        $metodos = array_unique(array_merge(['efectivo'], $request->metodos));

        $this->settings()->update([
            'payment_methods' => array_values($metodos),
            'payment_details' => $request->detalles ?? [],
        ]);

        AuditLog::registrar('update', 'Configuracion', null, 'Métodos de pago actualizados', [
            'metodos' => array_values($metodos),
        ]);

        return back()->with('success', 'Métodos de pago actualizados correctamente.');
    }

    // ── Tarifas de domicilio ──────────────────────────────────────────────────

    public function domicilio()
    {
        if (!\App\Services\PlanService::can('delivery')) {
            return redirect('/dashboard')
                ->with('warning', 'La configuración de domicilio requiere el plan Escala (anual).');
        }

        $settings = $this->settings();

        return Inertia::render('Configuraciones/Domicilio', [
            'delivery_enabled'   => (bool) ($settings->delivery_enabled   ?? false),
            'delivery_min_order' => (int)  ($settings->delivery_min_order ?? 0),
            'delivery_zones'     => $settings->delivery_zones ?? [],
        ]);
    }

    public function guardarDomicilio(Request $request)
    {
        if (!\App\Services\PlanService::can('delivery')) {
            return redirect('/dashboard')
                ->with('warning', 'La configuración de domicilio requiere el plan Escala (anual).');
        }

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

        AuditLog::registrar('update', 'Configuracion', null, 'Configuración de domicilio actualizada', [
            'delivery_enabled'   => $request->boolean('delivery_enabled'),
            'delivery_min_order' => (int) ($request->delivery_min_order ?? 0),
            'zones_count'        => count($request->delivery_zones ?? []),
        ]);

        return back()->with('success', 'Configuración de domicilio actualizada correctamente.');
    }

    // ── Horario de trabajo ────────────────────────────────────────────────────

    private function defaultSchedule(): array
    {
        $default = ['activo' => true, 'apertura' => '08:00', 'cierre' => '22:00'];
        return [
            'lun' => $default, 'mar' => $default, 'mie' => $default,
            'jue' => $default, 'vie' => $default,
            'sab' => ['activo' => true, 'apertura' => '09:00', 'cierre' => '23:00'],
            'dom' => ['activo' => false, 'apertura' => '09:00', 'cierre' => '21:00'],
        ];
    }

    public function horario()
    {
        $settings      = $this->settings();
        $schedule      = $settings->work_schedule ?? $this->defaultSchedule();
        $lastClosing   = DailyClosing::latest('closed_at')->first();

        return Inertia::render('Configuraciones/Horario', [
            'schedule'     => $schedule,
            'last_closing' => $lastClosing?->closed_at?->format('d/m/Y H:i'),
        ]);
    }

    public function guardarHorario(Request $request)
    {
        $days = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];

        $request->validate(array_merge(...array_map(fn($d) => [
            "{$d}.activo"   => 'boolean',
            "{$d}.apertura" => 'nullable|date_format:H:i',
            "{$d}.cierre"   => 'nullable|date_format:H:i',
        ], $days)));

        $schedule = [];
        foreach ($days as $day) {
            $d = $request->input($day, []);
            $schedule[$day] = [
                'activo'   => (bool) ($d['activo']   ?? false),
                'apertura' => $d['apertura'] ?? '08:00',
                'cierre'   => $d['cierre']   ?? '22:00',
            ];
        }

        $this->settings()->update(['work_schedule' => $schedule]);

        AuditLog::registrar('update', 'Configuracion', null, 'Horario de trabajo actualizado');

        return back()->with('success', 'Horario de trabajo guardado correctamente.');
    }

    public function cierreJornada()
    {
        $now = now();

        $activeOrders = Order::whereNull('closed_at_eod')
            ->whereNotIn('status', ['cancelled'])
            ->with('table')
            ->get();

        $tablesFreed = 0;

        foreach ($activeOrders as $order) {
            $order->update(['closed_at_eod' => $now]);

            if ($order->table) {
                // RestaurantTable usa el campo 'status', no 'is_occupied'
                $order->table->update(['status' => 'free']);
                $tablesFreed++;
            }
        }

        DailyClosing::create([
            'closed_at'        => $now,
            'orders_cancelled' => 0,
            'tables_freed'     => $tablesFreed,
        ]);

        AuditLog::registrar('eod', 'Sistema', null, "Cierre de jornada ejecutado: {$activeOrders->count()} pedido(s) archivados, {$tablesFreed} mesa(s) liberadas");

        return back()->with('success', "Jornada cerrada. {$activeOrders->count()} pedido(s) archivados y {$tablesFreed} mesa(s) liberadas.");
    }

    // ── Mi Plan ───────────────────────────────────────────────────────────────
    public function miPlan()
    {
        $plan      = \App\Services\PlanService::currentPlan();
        $daysLeft  = \App\Services\PlanService::daysUntilExpiry();
        $expiresAt = tenant()?->expires_at;

        $features = [
            'starter' => [
                'name'     => 'Starter',
                'price'    => '$0',
                'period'   => 'gratis para siempre',
                'color'    => 'emerald',
                'includes' => ['Menú digital QR', 'Hasta 30 platos', '1 código QR', 'Soporte por email'],
                'excludes' => ['Pedidos desde mesa', 'Notificaciones WhatsApp', 'Analytics', 'Delivery propio'],
            ],
            'basico' => [
                'name'     => 'Básico',
                'price'    => '$34.900',
                'period'   => '/mes · COP',
                'color'    => 'zinc',
                'includes' => ['Menú ilimitado', 'QR ilimitados', 'Pedidos desde mesa', 'Notif. WhatsApp', 'KDS cocina', 'Soporte por chat'],
                'excludes' => ['Analytics avanzado', 'Delivery propio'],
            ],
            'trimestral' => [
                'name'     => 'Trimestral',
                'price'    => '$83.900',
                'period'   => '/3 meses · COP',
                'color'    => 'blue',
                'includes' => ['Todo lo de Básico', 'Analytics de ventas', 'Reportes avanzados', 'Horas pico', 'Soporte prioritario'],
                'excludes' => ['Delivery propio'],
            ],
            'semestral' => [
                'name'     => 'Pro',
                'price'    => '$146.900',
                'period'   => '/6 meses · COP',
                'color'    => 'purple',
                'includes' => ['Todo lo de Trimestral', 'Soporte prioritario', 'Asesoría inicial', 'Acceso anticipado'],
                'excludes' => ['Delivery propio'],
            ],
            'anual' => [
                'name'     => 'Escala',
                'price'    => '$230.900',
                'period'   => '/año · COP',
                'color'    => 'amber',
                'includes' => ['Todo lo de Pro', 'Delivery propio', 'Sin comisión', 'Página del restaurante', 'Soporte dedicado'],
                'excludes' => [],
            ],
        ];

        return Inertia::render('Configuraciones/MiPlan', [
            'current_plan'    => $plan,
            'days_left'       => $daysLeft,
            'expires_at'      => $expiresAt,
            'payment_status'  => tenant()?->payment_status ?? 'paid',
            'features'        => $features,
            'current_feature' => $features[$plan] ?? $features['starter'],
        ]);
    }
}
