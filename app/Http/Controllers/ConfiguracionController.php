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
            'metodos.*'                    => 'required|string|in:efectivo,datafono,nequi,daviplata,pse,transferencia',
            'detalles'                     => 'nullable|array',
            'detalles.*.titular'           => 'nullable|string|max:120',
            'detalles.*.numero'            => 'nullable|string|max:60',
            'detalles.*.link'              => 'nullable|url|max:500',
            'detalles.*.tipo_cuenta'       => 'nullable|string|in:ahorros,corriente,',
            'detalles.*.banco'             => 'nullable|string|max:80',
            'detalles.*.nota'              => 'nullable|string|max:200',
            'detalles.*.qr_image'          => 'nullable|image|max:2048',
        ]);

        $metodos = array_unique(array_merge(['efectivo'], $request->metodos));
        $settings = $this->settings();
        $detalles = $request->detalles ?? [];

        foreach ($detalles as $metodo => &$detalle) {
            if ($request->hasFile("detalles.{$metodo}.qr_image")) {
                $path = $request->file("detalles.{$metodo}.qr_image")->store('qr_codes', 'public');
                $detalle['qr_image_path'] = $path;
                unset($detalle['qr_image']);
            } else {
                // Mantener el QR existente si no se sube uno nuevo
                if (isset($settings->payment_details[$metodo]['qr_image_path'])) {
                    $detalle['qr_image_path'] = $settings->payment_details[$metodo]['qr_image_path'];
                }
            }
        }

        $settings->update([
            'payment_methods' => array_values($metodos),
            'payment_details' => $detalles,
        ]);

        \App\Http\Controllers\CartaController::invalidarCachePublica();

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
                ->with('warning', 'La configuración de domicilio requiere un plan activo.');
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
                ->with('warning', 'La configuración de domicilio requiere un plan activo.');
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

        \App\Http\Controllers\CartaController::invalidarCachePublica();

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
                'activo'   => filter_var($d['activo'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'apertura' => $d['apertura'] ?? '08:00',
                'cierre'   => $d['cierre']   ?? '22:00',
            ];
        }

        $this->settings()->update(['work_schedule' => $schedule]);

        \App\Http\Controllers\CartaController::invalidarCachePublica();

        AuditLog::registrar('update', 'Configuracion', null, 'Horario de trabajo actualizado');

        return back()->with('success', 'Horario de trabajo guardado correctamente.');
    }

    // ── Flujo de pedido (solo Puesto de Comidas Rápidas) ─────────────────────

    public function flujo()
    {
        $settings = $this->settings();
        $defaultFlow = tenant('type') === 'puesto' ? 'pago_primero' : 'cocina_primero';
        $hasTables = RestaurantTable::count() > 0;

        $types = $settings->delivery_types ?? ['mostrador', 'mesa', 'domicilio'];
        if (!$hasTables) {
            $types = array_values(array_diff($types, ['mesa']));
            if (empty($types)) {
                $types = ['mostrador'];
            }
        }

        return Inertia::render('Configuraciones/Flujo', [
            'order_flow'     => $settings->order_flow ?? $defaultFlow,
            'delivery_types' => $types,
            'has_tables'     => $hasTables,
        ]);
    }

    public function guardarFlujo(Request $request)
    {
        $request->validate([
            'order_flow'     => 'required|in:pago_primero,cocina_primero',
            'delivery_types' => 'required|array|min:1',
            'delivery_types.*' => 'in:mostrador,mesa,domicilio',
        ]);

        $types = $request->delivery_types;
        
        if (in_array('mesa', $types) && RestaurantTable::count() === 0) {
            return back()->withErrors(['delivery_types' => 'Para habilitar "Mesa" debes tener al menos una mesa registrada.']);
        }

        $this->settings()->update([
            'order_flow'     => $request->order_flow,
            'delivery_types' => $types,
        ]);

        \App\Http\Controllers\CartaController::invalidarCachePublica();

        AuditLog::registrar('update', 'Configuracion', null, 'Flujo de pedido y tipos de entrega actualizados', [
            'order_flow'     => $request->order_flow,
            'delivery_types' => $types,
        ]);

        return back()->with('success', 'Configuración de entrega guardada correctamente.');
    }

    public function cierreJornada()
    {
        $now = now();

        // 1. Pedidos completamente saldados o cancelados: archivarlos para que no aparezcan en la siguiente jornada
        $ordersToArchive = Order::whereNull('closed_at_eod')
            ->where(function ($q) {
                $q->whereColumn('amount_paid', '>=', 'total')
                  ->orWhere('status', 'cancelled');
            })
            ->get();

        foreach ($ordersToArchive as $order) {
            $order->update(['closed_at_eod' => $now]);
        }

        // 2. Pedidos con saldo pendiente (Cuentas por cobrar):
        // NO se les asigna closed_at_eod para que sigan existiendo en Caja para cobrar.
        // Si estaban en preparación/cocina/mesa, se pasan a 'delivered' (consumido) para
        // limpiar comandas en cocina al día siguiente, preservando la deuda en Caja con su fecha original.
        $pendingDebtOrders = Order::whereNull('closed_at_eod')
            ->where('status', '!=', 'cancelled')
            ->whereColumn('amount_paid', '<', 'total')
            ->where('total', '>', 0)
            ->get();

        foreach ($pendingDebtOrders as $order) {
            if (in_array($order->status, ['pending', 'at_cash', 'in_kitchen', 'cooking', 'ready'])) {
                $order->update([
                    'status'       => 'delivered',
                    'delivered_at' => $order->delivered_at ?? $now,
                ]);
            }
        }

        // 3. Liberar mesas físicas para que en la próxima jornada estén disponibles
        $tablesFreed = 0;
        $occupiedTables = RestaurantTable::whereIn('status', ['occupied', 'reserved'])->get();
        foreach ($occupiedTables as $table) {
            $table->update(['status' => 'available']);
            $tablesFreed++;
        }

        DailyClosing::create([
            'closed_at'        => $now,
            'orders_cancelled' => 0,
            'tables_freed'     => $tablesFreed,
        ]);

        AuditLog::registrar('eod', 'Sistema', null, "Cierre de jornada ejecutado: {$ordersToArchive->count()} pedido(s) saldados archivados, {$pendingDebtOrders->count()} cuenta(s) por cobrar mantenida(s), {$tablesFreed} mesa(s) liberadas");

        $msg = "Jornada cerrada. {$ordersToArchive->count()} pedido(s) archivados y {$tablesFreed} mesa(s) liberadas.";
        if ($pendingDebtOrders->count() > 0) {
            $msg .= " Se mantuvieron {$pendingDebtOrders->count()} cuenta(s) por cobrar registradas en Caja.";
        }

        return back()->with('success', $msg);
    }

    // ── Mi Plan ───────────────────────────────────────────────────────────────
    public function miPlan()
    {
        $plan      = \App\Services\PlanService::currentPlan();
        $daysLeft  = \App\Services\PlanService::daysUntilExpiry();
        $expiresAt = tenant()?->expires_at;

        $features = [
            'starter' => [
                'name'     => 'Básico',
                'price'    => '$20.000',
                'period'   => '/mes · COP',
                'color'    => 'zinc',
                'includes' => ['Menú digital QR ilimitado', 'Soporte por chat'],
                'excludes' => ['Pedidos desde mesa', 'Delivery propio', 'Analítica y reportes'],
            ],
            'pro' => [
                'name'     => 'Pro',
                'price'    => '$40.000',
                'period'   => '/mes · COP',
                'color'    => 'blue',
                'includes' => ['Menú digital QR ilimitado', 'Pedidos desde mesa', 'Analítica y reportes', 'Soporte por chat'],
                'excludes' => ['Delivery propio'],
            ],
            'premium' => [
                'name'     => 'Premium',
                'price'    => '$60.000',
                'period'   => '/mes · COP',
                'color'    => 'purple',
                'includes' => ['Menú digital QR ilimitado', 'Pedidos desde mesa', 'Delivery propio', 'Analítica y reportes', 'Soporte VIP'],
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
