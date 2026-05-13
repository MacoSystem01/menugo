<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carta_settings', function (Blueprint $table) {
            $table->json('social_links')->nullable()->after('payment_methods');
        });
    }

    public function down(): void
    {
        Schema::table('carta_settings', function (Blueprint $table) {
            $table->dropColumn('social_links');
        });
    }
};
