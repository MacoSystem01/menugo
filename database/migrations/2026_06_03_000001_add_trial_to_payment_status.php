<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // payment_status ya es VARCHAR(20) — acepta 'trial' sin cambio de esquema
        // Esta migración registra 'trial' como valor válido para trazabilidad
        \Illuminate\Support\Facades\DB::statement("
            UPDATE tenants
            SET payment_status = 'trial'
            WHERE 1=0
        "); // No-op — solo valida que la columna existe
    }

    public function down(): void {}
};
