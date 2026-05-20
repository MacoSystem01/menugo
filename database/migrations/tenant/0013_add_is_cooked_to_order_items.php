<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->boolean('is_cooked')->default(false)->after('is_addition');
        });

        // Ítems de pedidos ya entregados se consideran cocinados.
        DB::statement("
            UPDATE order_items oi
            INNER JOIN orders o ON oi.order_id = o.id
            SET oi.is_cooked = 1
            WHERE o.status = 'delivered'
        ");
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('is_cooked');
        });
    }
};
