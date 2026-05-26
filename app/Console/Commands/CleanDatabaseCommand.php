<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Tenant;
use App\Models\AuditLog;
use App\Models\KitchenNote;
use App\Models\OrderItem;
use App\Models\Order;
use App\Models\InventoryItem;
use App\Models\RestaurantTable;
use App\Models\DailyClosing;

class CleanDatabaseCommand extends Command
{
    protected $signature = 'app:limpiar-db';
    protected $description = 'Limpia la base de datos conservando Usuarios, Carta, Categorías y Platos';

    public function handle()
    {
        $this->info('Iniciando limpieza de base de datos...');

        $tenants = Tenant::withoutTrashed()->get();

        if ($tenants->isEmpty()) {
            $this->warn('No se encontraron sucursales (tenants) para limpiar.');
            return;
        }

        foreach ($tenants as $tenant) {
            tenancy()->initialize($tenant);
            
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            
            AuditLog::truncate();
            KitchenNote::truncate();
            OrderItem::truncate();
            Order::truncate();
            InventoryItem::truncate();
            RestaurantTable::truncate();
            
            if (class_exists(DailyClosing::class)) {
                DailyClosing::truncate();
            }
            
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            
            $this->line("✔ Sucursal [{$tenant->id}] limpiada.");
            tenancy()->end();
        }

        $this->info('🚀 ¡Limpieza completada con éxito!');
    }
}
