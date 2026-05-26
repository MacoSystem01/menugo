<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Índices compuestos para +1000 usuarios simultáneos.
 * Los índices simples ya están en 0012_add_performance_indexes.php.
 * Estos cubren los queries más frecuentes del sistema:
 * - Caja: orders WHERE closed_at_eod IS NULL AND status NOT IN (...)
 * - Cocina: orders WHERE status IN (pending, in_kitchen, cooking, ready)
 * - Reporte: orders WHERE DATE(created_at) BETWEEN ... AND status != 'cancelled'
 * - Order items: order_id + is_cooked + is_prepared
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── orders: índice compuesto para vista Caja ───────────────────────────
        // Query: WHERE closed_at_eod IS NULL AND status NOT IN ('delivered','cancelled')
        Schema::table('orders', function (Blueprint $table) {
            if (! $this->indexExists('orders', 'orders_eod_status_compound')) {
                $table->index(['closed_at_eod', 'status'], 'orders_eod_status_compound');
            }
            if (! $this->indexExists('orders', 'orders_table_status_compound')) {
                $table->index(['table_id', 'status'], 'orders_table_status_compound');
            }
        });

        // ── order_items: índice para KDS (marcar preparado/cocinado) ──────────
        Schema::table('order_items', function (Blueprint $table) {
            if (! $this->indexExists('order_items', 'order_items_order_cooked_prepared')) {
                $table->index(['order_id', 'is_cooked', 'is_prepared'], 'order_items_order_cooked_prepared');
            }
        });

        // ── kitchen_notes: índice para novedades recientes ─────────────────────
        Schema::table('kitchen_notes', function (Blueprint $table) {
            if (! $this->indexExists('kitchen_notes', 'kitchen_notes_verified_at_index')) {
                $table->index('verified_at');
            }
        });

        // ── categories: índice para carta pública ──────────────────────────────
        Schema::table('categories', function (Blueprint $table) {
            if (! $this->indexExists('categories', 'categories_active_sort_compound')) {
                $table->index(['active', 'sort_order'], 'categories_active_sort_compound');
            }
        });

        // ── dishes: índice para filtrar disponibles ────────────────────────────
        Schema::table('dishes', function (Blueprint $table) {
            if (! $this->indexExists('dishes', 'dishes_category_available_compound')) {
                $table->index(['category_id', 'available'], 'dishes_category_available_compound');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndexIfExists('orders_eod_status_compound');
            $table->dropIndexIfExists('orders_table_status_compound');
        });
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndexIfExists('order_items_order_cooked_prepared');
        });
        Schema::table('kitchen_notes', function (Blueprint $table) {
            $table->dropIndexIfExists('kitchen_notes_verified_at_index');
        });
        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndexIfExists('categories_active_sort_compound');
        });
        Schema::table('dishes', function (Blueprint $table) {
            $table->dropIndexIfExists('dishes_category_available_compound');
        });
    }

    private function indexExists(string $table, string $index): bool
    {
        return collect(DB::select("SHOW INDEX FROM `{$table}`"))
            ->pluck('Key_name')
            ->contains($index);
    }
};
