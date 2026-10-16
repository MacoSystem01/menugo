<?php

namespace App\Console\Commands;

use App\Models\DailyClosing;
use App\Models\Order;
use App\Models\RestaurantTable;
use App\Models\Tenant;
use Illuminate\Console\Command;

class CierreDiario extends Command
{
    protected $signature   = 'app:cierre-diario';
    protected $description = 'Cierre automático de día: cancela pedidos abiertos y libera mesas en todos los tenants';

    private const OPEN_STATUSES = ['pending', 'at_cash', 'in_kitchen', 'cooking', 'ready'];

    public function handle(): int
    {
        $tenants = Tenant::withoutTrashed()->get();

        if ($tenants->isEmpty()) {
            $this->info('No hay tenants registrados.');
            return self::SUCCESS;
        }

        foreach ($tenants as $tenant) {
            tenancy()->initialize($tenant);

            try {
                $this->cerrarTenant($tenant->id);
            } finally {
                tenancy()->end();
            }
        }

        return self::SUCCESS;
    }

    private function cerrarTenant(string $tenantId): void
    {
        $now = now();

        // 1. Pedidos vacíos sin platos/items o sin total: cancelarlos y archivarlos
        $ordersCancelled = Order::whereNull('closed_at_eod')
            ->whereIn('status', self::OPEN_STATUSES)
            ->where('total', '<=', 0)
            ->where('amount_paid', '<=', 0)
            ->update([
                'status'        => 'cancelled',
                'closed_at_eod' => $now,
            ]);

        // 2. Pedidos activos que tienen saldo pendiente y productos (cuentas por cobrar):
        // NO cancelarlos ni colocarles closed_at_eod.
        // Se avanzan a 'delivered' (si estaban en cocina/mesa) para no dejar comandas
        // pendientes en la pantalla de cocina al día siguiente, pero preservando la deuda en Caja con su fecha original.
        $pendingDebtOrders = Order::whereNull('closed_at_eod')
            ->where('status', '!=', 'cancelled')
            ->whereColumn('amount_paid', '<', 'total')
            ->where('total', '>', 0)
            ->get();

        foreach ($pendingDebtOrders as $debtOrder) {
            if (in_array($debtOrder->status, self::OPEN_STATUSES)) {
                $debtOrder->update([
                    'status'       => 'delivered',
                    'delivered_at' => $debtOrder->delivered_at ?? $now,
                ]);
            }
        }

        // 3. Archivar pedidos completamente saldados o cancelados que no tengan closed_at_eod
        Order::whereNull('closed_at_eod')
            ->where(function ($q) {
                $q->whereColumn('amount_paid', '>=', 'total')
                  ->orWhere('status', 'cancelled');
            })
            ->update(['closed_at_eod' => $now]);

        // 4. Liberar mesas físicas para el siguiente turno
        $tablesFreed = RestaurantTable::whereIn('status', ['occupied', 'reserved'])->count();

        RestaurantTable::whereIn('status', ['occupied', 'reserved'])->update([
            'status' => 'available',
        ]);

        DailyClosing::create([
            'closed_at'        => $now,
            'orders_cancelled' => $ordersCancelled,
            'tables_freed'     => $tablesFreed,
        ]);

        $this->line(sprintf(
            '[%s] Tenant %s — %d pedido(s) cancelado(s), %d cuenta(s) por cobrar preservada(s), %d mesa(s) liberada(s).',
            $now->format('Y-m-d H:i:s'),
            $tenantId,
            $ordersCancelled,
            $pendingDebtOrders->count(),
            $tablesFreed,
        ));
    }
}
