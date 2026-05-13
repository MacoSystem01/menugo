<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_method', 50)->nullable()->after('notes');
        });

        Schema::table('carta_settings', function (Blueprint $table) {
            $table->json('payment_methods')->default('["efectivo"]')->after('banner_image');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('payment_method');
        });
        Schema::table('carta_settings', function (Blueprint $table) {
            $table->dropColumn('payment_methods');
        });
    }
};
