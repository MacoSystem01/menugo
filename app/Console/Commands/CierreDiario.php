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

        $ordersCancelled = Order::whereIn('status', self::OPEN_STATUSES)->count();

        Order::whereIn('status', self::OPEN_STATUSES)->update([
            'status'        => 'cancelled',
            'closed_at_eod' => $now,
        ]);

        // Archivar también los pedidos ya finalizados (entregados/cancelados) de la jornada,
        // para que no sigan apareciendo como "recientes" en el dashboard de la jornada siguiente.
        Order::whereNull('closed_at_eod')->update(['closed_at_eod' => $now]);

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
            '[%s] Tenant %s — %d pedido(s) cerrado(s), %d mesa(s) liberada(s).',
            $now->format('Y-m-d H:i:s'),
            $tenantId,
            $ordersCancelled,
            $tablesFreed,
        ));
    }
}
