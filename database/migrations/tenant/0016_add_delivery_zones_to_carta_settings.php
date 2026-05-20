<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carta_settings', function (Blueprint $table) {
            $table->boolean('delivery_enabled')->default(false)->after('payment_methods');
            $table->unsignedInteger('delivery_min_order')->default(0)->after('delivery_enabled');
            $table->json('delivery_zones')->nullable()->after('delivery_min_order');
        });
    }

    public function down(): void
    {
        Schema::table('carta_settings', function (Blueprint $table) {
            $table->dropColumn(['delivery_enabled', 'delivery_min_order', 'delivery_zones']);
        });
    }
};
