<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Índices de rendimiento y seguridad en tablas centrales.
 *
 * Motivación:
 * - AdminDashboardController filtra tenants por payment_status frecuentemente
 *   (systemHealth, billing, index). Sin índice, esto hace full table scan en cada petición.
 * - domains.domain es el campo usado para resolver el tenant en CADA request entrante
 *   (InitializeTenancyByDomain). Si no tiene índice único, la resolución escala O(n).
 * - tenants.name es usado en TenantController::find() con LIKE — el índice ayuda
 *   en búsquedas con prefijo.
 *
 * Para 1000+ tenants simultáneos estos índices son críticos.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── tenants: índice en payment_status ─────────────────────────────────
        // AdminDashboardController filtra whereIn('payment_status', [...]) en cada req
        Schema::table('tenants', function (Blueprint $table) {
            if (! $this->indexExists('tenants', 'tenants_payment_status_index')) {
                $table->index('payment_status', 'tenants_payment_status_index');
            }
            // Índice compuesto para la consulta más frecuente del systemHealth:
            // WHERE payment_status IN ('pending_payment','pending_review') AND deleted_at IS NULL
            if (! $this->indexExists('tenants', 'tenants_payment_status_deleted_at')) {
                $table->index(['payment_status', 'deleted_at'], 'tenants_payment_status_deleted_at');
            }
        });

        // ── domains: índice único en domain ───────────────────────────────────
        // Este campo se usa en CADA request del tenant para resolver la BD.
        // Stancl puede ya crear un unique index; verificar antes de añadir.
        Schema::table('domains', function (Blueprint $table) {
            if (! $this->indexExists('domains', 'domains_domain_unique')) {
                // Si ya existe otro unique index (domain_unique), no duplicar
                if (! $this->indexExists('domains', 'domain_unique')) {
                    $table->unique('domain', 'domains_domain_unique');
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropIndexIfExists('tenants_payment_status_index');
            $table->dropIndexIfExists('tenants_payment_status_deleted_at');
        });
        Schema::table('domains', function (Blueprint $table) {
            $table->dropIndexIfExists('domains_domain_unique');
        });
    }

    private function indexExists(string $table, string $index): bool
    {
        return collect(DB::select("SHOW INDEX FROM `{$table}`"))
            ->pluck('Key_name')
            ->contains($index);
    }
};
