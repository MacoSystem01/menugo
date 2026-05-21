<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carta_settings', function (Blueprint $table) {
            $table->decimal('restaurant_lat', 10, 7)->nullable()->after('delivery_zones');
            $table->decimal('restaurant_lng', 10, 7)->nullable()->after('restaurant_lat');
            $table->string('restaurant_address')->nullable()->after('restaurant_lng');
        });
    }

    public function down(): void
    {
        Schema::table('carta_settings', function (Blueprint $table) {
            $table->dropColumn(['restaurant_lat', 'restaurant_lng', 'restaurant_address']);
        });
    }
};
