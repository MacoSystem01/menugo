<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // orders: status, type, created_at are used in almost every query
        Schema::table('orders', function (Blueprint $table) {
            if (! $this->indexExists('orders', 'orders_status_index')) {
                $table->index('status');
            }
            if (! $this->indexExists('orders', 'orders_type_index')) {
                $table->index('type');
            }
            if (! $this->indexExists('orders', 'orders_created_at_index')) {
                $table->index('created_at');
            }
            if (! $this->indexExists('orders', 'orders_delivery_user_id_index')) {
                $table->index('delivery_user_id');
            }
        });

        // audit_logs: action, auditable_type, causer_id for filtering
        Schema::table('audit_logs', function (Blueprint $table) {
            if (! $this->indexExists('audit_logs', 'audit_logs_action_index')) {
                $table->index('action');
            }
            if (! $this->indexExists('audit_logs', 'audit_logs_auditable_type_index')) {
                $table->index('auditable_type');
            }
            if (! $this->indexExists('audit_logs', 'audit_logs_causer_id_index')) {
                $table->index('causer_id');
            }
            if (! $this->indexExists('audit_logs', 'audit_logs_created_at_index')) {
                $table->index('created_at');
            }
        });

        // inventory_items: status for filtering
        Schema::table('inventory_items', function (Blueprint $table) {
            if (! $this->indexExists('inventory_items', 'inventory_items_status_index')) {
                $table->index('status');
            }
            if (! $this->indexExists('inventory_items', 'inventory_items_expiry_date_index')) {
                $table->index('expiry_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndexIfExists('orders_status_index');
            $table->dropIndexIfExists('orders_type_index');
            $table->dropIndexIfExists('orders_created_at_index');
            $table->dropIndexIfExists('orders_delivery_user_id_index');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndexIfExists('audit_logs_action_index');
            $table->dropIndexIfExists('audit_logs_auditable_type_index');
            $table->dropIndexIfExists('audit_logs_causer_id_index');
            $table->dropIndexIfExists('audit_logs_created_at_index');
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropIndexIfExists('inventory_items_status_index');
            $table->dropIndexIfExists('inventory_items_expiry_date_index');
        });
    }

    private function indexExists(string $table, string $index): bool
    {
        return collect(\Illuminate\Support\Facades\DB::select("SHOW INDEX FROM `{$table}`"))
            ->pluck('Key_name')
            ->contains($index);
    }
};
