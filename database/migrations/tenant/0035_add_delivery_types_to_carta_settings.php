<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carta_settings', function (Blueprint $table) {
            $table->json('delivery_types')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('carta_settings', function (Blueprint $table) {
            $table->dropColumn('delivery_types');
        });
    }
};
