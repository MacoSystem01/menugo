<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('order_items', 'is_addition')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->boolean('is_addition')->default(false)->after('notes');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('order_items', 'is_addition')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropColumn('is_addition');
            });
        }
    }
};
