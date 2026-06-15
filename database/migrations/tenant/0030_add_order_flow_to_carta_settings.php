<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carta_settings', function (Blueprint $table) {
            $table->string('order_flow')->default('pago_primero')->after('work_schedule');
        });
    }

    public function down(): void
    {
        Schema::table('carta_settings', function (Blueprint $table) {
            $table->dropColumn('order_flow');
        });
    }
};
