<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\RestaurantTable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $isOverdue = function_exists('tenant') && (tenant()?->payment_status ?? '') === 'overdue';
        $isTrial   = function_exists('tenant') && (tenant()?->payment_status ?? '') === 'trial';

        if ($isOverdue) {
            return Inertia::render('Dashboard', ['is_overdue' => true]);
        }

        $user = Auth::user();
        $role = $user->getRoleNames()->first() ?? 'gerente';

        return match (true) {
            in_array($role, ['gerente', 'administrador']) => $this->fullDashboard($isTrial),
            $role === 'caja'                              => $this->cajaDashboard(),
            $role === 'cocina'                            => $this->cocinaDashboard(),
            $role === 'mesa'                              => $this->mesaDashboard(),
            $role === 'domicilio'                         => $this->domicilioDashboard($user),
            default                                       => $this->fullDashboard($isTrial),
        };
    }

    // ── Gerente / Administrador ───────────────────────────────────────────────

    private function fullDashboard(bool $isTrial = false)
    {
        $today = now()->toDateString();

        $ventasHoy = Order::whereDate('created_at', $today)
            ->whereNotIn('status', ['cancelled'])->sum('total');

        $pedidosHoy = Order::whereDate('created_at', $today)
            ->whereNotIn('status', ['cancelled'])->count();

        $clientesHoy = Order::whereDate('created_at', $today)
            ->whereNotIn('status', ['cancelled'])
            ->distinct('customer_phone')->count('customer_phone');

        $ticketPromedio = $pedidosHoy > 0 ? round($ventasHoy / $pedidosHoy, 2) : 0;

        $pedidosRecientes = Order::with(['items.dish', 'table'])
            ->whereDate('created_at', $today)
            ->whereNull('closed_at_eod')
            ->latest()->take(10)->get()
            ->map(fn($o) => [
                'id'          => $o->id,
                'resumen'     => $o->items->map(fn($i) => "{$i->quantity}x {$i->dish?->name}")->implode(', ') ?: '—',
                'total'       => (float) $o->total,
                'amount_paid' => (float) $o->amount_paid,
                'status'      => $o->status,
                'tipo'        => $o->type,
                'mesa'        => $o->table?->number,
                'tiempo'      => $o->created_at->diffForHumans(short: true),
            ]);

        $topPlatos = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('dishes', 'dishes.id', '=', 'order_items.dish_id')
            ->whereDate('orders.created_at', $today)
            ->whereNotIn('orders.status', ['cancelled'])
            ->groupBy('dishes.id', 'dishes.name')
            ->select('dishes.name', DB::raw('SUM(order_items.quantity) as vendidos'),
                DB::raw('SUM(order_items.quantity * order_items.unit_price) as ingresos'))
            ->orderByDesc('vendidos')->take(5)->get();

        return Inertia::render('Dashboard', [
            'dashboardRole'      => 'full',
            'stats'              => [
                'ventas_hoy'      => (float) $ventasHoy,
                'pedidos_hoy'     => $pedidosHoy,
                'clientes_hoy'    => $clientesHoy,
                'ticket_promedio' => (float) $ticketPromedio,
            ],
            'pedidos_recientes'  => $pedidosRecientes,
            'top_platos'         => $topPlatos,
            'is_trial'           => $isTrial,
        ]);
    }

    // ── Caja ──────────────────────────────────────────────────────────────────

    private function cajaDashboard()
    {
        $today = now()->toDateString();

        $ventasHoy = Order::whereDate('created_at', $today)
            ->whereIn('status', ['delivered', 'cancelled'])
            ->where('amount_paid', '>', 0)->sum('amount_paid');

        $pedidosCobrados = Order::whereDate('created_at', $today)
            ->whereIn('status', ['delivered', 'cancelled'])
            ->where('amount_paid', '>', 0)->count();

        $pendientesCobro = Order::whereIn('status', ['at_cash'])->count();

        $transacciones = Order::with(['table'])
            ->whereDate('created_at', $today)
            ->whereNull('closed_at_eod')
            ->where('amount_paid', '>', 0)
            ->latest()->take(15)->get()
            ->map(fn($o) => [
                'id'           => $o->id,
                'tipo'         => $o->type,
                'mesa'         => $o->table?->number,
                'total'        => $o->total,
                'amount_paid'  => $o->amount_paid,
                'status'       => $o->status,
                'tiempo'       => $o->created_at->diffForHumans(short: true),
            ]);

        return Inertia::render('Dashboard', [
            'dashboardRole'     => 'caja',
            'stats'             => [
                'ventas_hoy'       => (float) $ventasHoy,
                'pedidos_cobrados' => $pedidosCobrados,
                'pendientes_cobro' => $pendientesCobro,
            ],
            'transacciones'     => $transacciones,
        ]);
    }

    // ── Cocina ────────────────────────────────────────────────────────────────

    private function cocinaDashboard()
    {
        $cola = Order::with(['items.dish', 'table'])
            ->whereIn('status', ['in_kitchen', 'cooking'])
            ->oldest()->get()
            ->map(fn($o) => [
                'id'      => $o->id,
                'tipo'    => $o->type,
                'mesa'    => $o->table?->number,
                'status'  => $o->status,
                'items'   => $o->items->map(fn($i) => [
                    'dish'     => $i->dish?->name,
                    'quantity' => $i->quantity,
                    'notes'    => $i->notes,
                ]),
                'tiempo'  => $o->created_at->diffForHumans(short: true),
                'mins'    => (int) $o->created_at->diffInMinutes(now()),
            ]);

        $pendientes = Order::where('status', 'in_kitchen')->count();
        $cocinando  = Order::where('status', 'cooking')->count();
        $listos     = Order::where('status', 'ready')->count();

        return Inertia::render('Dashboard', [
            'dashboardRole' => 'cocina',
            'stats'         => [
                'pendientes' => $pendientes,
                'cocinando'  => $cocinando,
                'listos'     => $listos,
            ],
            'cola'          => $cola,
        ]);
    }

    // ── Mesa ──────────────────────────────────────────────────────────────────

    private function mesaDashboard()
    {
        $mesas = RestaurantTable::with(['orders' => fn($q) => $q->whereIn('status',
            ['in_kitchen', 'cooking', 'ready'])])
            ->orderBy('number')->get()
            ->map(fn($t) => [
                'id'      => $t->id,
                'number'  => $t->number,
                'status'  => $t->status,
                'pedidos' => $t->orders->count(),
                'listos'  => $t->orders->where('status', 'ready')->count(),
            ]);

        $pedidosActivos = Order::with(['items.dish', 'table'])
            ->whereIn('status', ['in_kitchen', 'cooking', 'ready'])
            ->where('type', 'mesa')
            ->latest()->get()
            ->map(fn($o) => [
                'id'     => $o->id,
                'mesa'   => $o->table?->number,
                'status' => $o->status,
                'total'  => $o->total,
                'items'  => $o->items->count(),
                'tiempo' => $o->created_at->diffForHumans(short: true),
            ]);

        return Inertia::render('Dashboard', [
            'dashboardRole'  => 'mesa',
            'mesas'          => $mesas,
            'pedidos_activos'=> $pedidosActivos,
        ]);
    }

    // ── Domicilio ─────────────────────────────────────────────────────────────

    private function domicilioDashboard($user)
    {
        $asignados = Order::with(['items.dish'])
            ->where('type', 'domicilio')
            ->whereIn('status', ['ready', 'in_kitchen', 'cooking', 'delivered'])
            ->where(function ($q) use ($user) {
                $q->where('delivery_user_id', $user->id)->orWhereNull('delivery_user_id');
            })
            ->latest()->take(20)->get()
            ->map(fn($o) => [
                'id'               => $o->id,
                'customer_name'    => $o->customer_name,
                'customer_phone'   => $o->customer_phone,
                'delivery_address' => $o->delivery_address,
                'status'           => $o->status,
                'total'            => $o->total,
                'delivery_user_id' => $o->delivery_user_id,
                'items'            => $o->items->count(),
                'tiempo'           => $o->created_at->diffForHumans(short: true),
            ]);

        $stats = [
            'pendientes' => $asignados->whereIn('status', ['ready', 'in_kitchen', 'cooking'])->count(),
            'entregados' => $asignados->where('status', 'delivered')->count(),
        ];

        return Inertia::render('Dashboard', [
            'dashboardRole' => 'domicilio',
            'stats'         => $stats,
            'asignados'     => $asignados->values(),
        ]);
    }
}
