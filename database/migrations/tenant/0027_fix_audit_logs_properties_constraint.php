<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Elimina el CHECK constraint json_valid(properties) de audit_logs.
 *
 * El modelo AuditLog usa cast 'encrypted:array' para properties, que almacena
 * un string encriptado (base64) — NO JSON válido. MariaDB rechaza este valor
 * con: CONSTRAINT `audit_logs.properties` failed (SQLSTATE 23000 / errno 4025).
 *
 * La solución es la misma que migración 0024 aplicó a carta_settings.payment_details:
 * MODIFY COLUMN recrea la columna sin el CHECK implícito de json_valid.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            'ALTER TABLE audit_logs MODIFY COLUMN properties longtext DEFAULT NULL'
        );
    }

    public function down(): void
    {
        // Restaurar CHECK constraint (solo funciona si los datos son JSON válido)
        DB::statement(
            'ALTER TABLE audit_logs MODIFY COLUMN properties longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(properties))'
        );
    }
};
