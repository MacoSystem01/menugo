<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Elimina de la DB central las tablas que pertenecen exclusivamente a cada tenant.
 * Estas tablas fueron creadas por error al ejecutar `php artisan migrate` antes de
 * que la arquitectura multi-tenant estuviera consolidada.
 *
 * Las migraciones originales fueron movidas a database/migrations/retired/ para que
 * `php artisan migrate` no las vuelva a ejecutar en la DB central.
 *
 * Cada tenant tiene sus propias tablas en su BD aislada (prefijo Menugo_<uuid>),
 * creadas y gestionadas por `php artisan tenants:migrate`.
 */
return new class extends Migration
{
    private array $tenantTables = [
        'order_items',
        'orders',
        'kitchen_notes',
        'dishes',
        'categories',
        'restaurant_tables',
        'inventory_items',
    ];

    public function up(): void
    {
        // Desactivar foreign key checks para poder eliminar en cualquier orden
        Schema::disableForeignKeyConstraints();

        foreach ($this->tenantTables as $table) {
            Schema::dropIfExists($table);
        }

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // No se recrea: si se hace rollback, ejecutar `php artisan migrate:fresh`
        // o restaurar desde backup. Estas tablas no deben existir en la DB central.
    }
};
