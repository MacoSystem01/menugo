<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE orders MODIFY type ENUM('mesa', 'domicilio', 'mostrador') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE orders MODIFY type ENUM('mesa', 'domicilio') NOT NULL");
    }
};
