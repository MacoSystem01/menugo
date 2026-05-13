<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('closed_at_eod')->nullable()->after('delivered_at');
        });

        Schema::create('daily_closings', function (Blueprint $table) {
            $table->id();
            $table->timestamp('closed_at');
            $table->unsignedInteger('orders_cancelled')->default(0);
            $table->unsignedInteger('tables_freed')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('closed_at_eod');
        });
        Schema::dropIfExists('daily_closings');
    }
};
