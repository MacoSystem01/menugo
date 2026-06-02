<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // La columna plan ya es VARCHAR(30) — solo migramos registros legacy 'mensual' a 'basico'
        DB::statement("UPDATE tenants SET plan = 'basico' WHERE plan = 'mensual'");
    }

    public function down(): void
    {
        DB::statement("UPDATE tenants SET plan = 'mensual' WHERE plan = 'basico'");
    }
};
