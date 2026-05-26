<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Índices en la tabla central tenants para mejorar rendimiento del panel admin.
 * AdminDashboardController filtra por payment_status, created_at, deleted_at.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (! $this->indexExists('tenants', 'tenants_created_at_index')) {
                $table->index('created_at');
            }
            if (! $this->indexExists('tenants', 'tenants_deleted_at_index')) {
                $table->index('deleted_at');
            }
        });

        // Índice en domains para búsqueda rápida de subdominio
        Schema::table('domains', function (Blueprint $table) {
            if (! $this->indexExists('domains', 'domains_tenant_id_index')) {
                $table->index('tenant_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropIndexIfExists('tenants_created_at_index');
            $table->dropIndexIfExists('tenants_deleted_at_index');
        });
        Schema::table('domains', function (Blueprint $table) {
            $table->dropIndexIfExists('domains_tenant_id_index');
        });
    }

    private function indexExists(string $table, string $index): bool
    {
        return collect(DB::select("SHOW INDEX FROM `{$table}`"))
            ->pluck('Key_name')
            ->contains($index);
    }
};
