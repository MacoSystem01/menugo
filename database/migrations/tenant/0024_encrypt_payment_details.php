<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/**
 * Migra payment_details de texto plano JSON → encriptado con AES-256 (APP_KEY).
 *
 * CartaSetting.payment_details almacena información bancaria sensible
 * (números de cuenta, titulares, datos de PSE/Nequi/Daviplata).
 *
 * El cast 'encrypted:array' de Laravel 11 usa internamente:
 *   - SET: Crypt::encrypt(json_encode($array), serialize=false)
 *   - GET: json_decode(Crypt::decrypt($value, serialize=false))
 *
 * Esta migración:
 *   1. Elimina el CHECK (json_valid) via MODIFY COLUMN (MariaDB 10.4 no soporta DROP CHECK)
 *   2. Encripta los registros existentes en el formato exacto del cast encrypted:array
 *
 * IMPORTANTE: NO usar Crypt::encrypt($array, true) — ese formato (PHP serialize)
 * no es compatible con encrypted:array; usar encryptString(json_encode($array)).
 */
return new class extends Migration
{
    public function up(): void
    {
        // ─── 1. Eliminar CHECK constraint json_valid(payment_details) ──────────
        // MariaDB 10.4 no soporta ALTER TABLE ... DROP CHECK.
        // MODIFY COLUMN recrea la columna sin el CHECK constraint implícito.
        DB::statement(
            'ALTER TABLE carta_settings MODIFY COLUMN payment_details longtext DEFAULT NULL'
        );

        // ─── 2. Encriptar datos existentes en formato compatible con encrypted:array
        $rows = DB::table('carta_settings')->whereNotNull('payment_details')->get();

        foreach ($rows as $row) {
            $value = $row->payment_details;

            // Detectar si ya está encriptado en el formato correcto (encrypted:array).
            // encrypted:array almacena: Crypt::decrypt($val, false) → JSON string válida.
            try {
                $decrypted = Crypt::decrypt($value, false);
                $arr = json_decode($decrypted, true);
                if (is_array($arr)) {
                    // Ya está en formato correcto para encrypted:array → saltar
                    continue;
                }
                // Podría estar en formato serialize=true (migración previa errónea)
                // → re-encriptar en formato correcto
                $altDecrypted = Crypt::decrypt($value, true);
                if (is_array($altDecrypted)) {
                    $encrypted = Crypt::encryptString(json_encode($altDecrypted));
                    DB::table('carta_settings')->where('id', $row->id)
                        ->update(['payment_details' => $encrypted]);
                    continue;
                }
            } catch (\Throwable) {
                // No es un valor encriptado o está en texto plano → proceder
            }

            // Verificar que es JSON válido antes de encriptar
            $decoded = json_decode($value, true);
            if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
                // Dato corrupto → NULL
                DB::table('carta_settings')->where('id', $row->id)
                    ->update(['payment_details' => null]);
                continue;
            }

            // Encriptar en el formato exacto del cast encrypted:array de Laravel 11
            // encrypted:array: SET → Crypt::encrypt(json_encode($value), false)
            //                  GET → json_decode(Crypt::decrypt($value, false))
            $encrypted = Crypt::encryptString(json_encode($decoded));
            DB::table('carta_settings')->where('id', $row->id)
                ->update(['payment_details' => $encrypted]);
        }
    }

    public function down(): void
    {
        // ─── 1. Desencriptar datos (formato encrypted:array) ───────────────────
        $rows = DB::table('carta_settings')->whereNotNull('payment_details')->get();

        foreach ($rows as $row) {
            try {
                // encrypted:array usa decrypt con serialize=false
                $jsonString = Crypt::decrypt($row->payment_details, false);
                $decoded    = json_decode($jsonString, true);

                DB::table('carta_settings')->where('id', $row->id)
                    ->update(['payment_details' => is_array($decoded) ? json_encode($decoded) : null]);
            } catch (\Throwable) {
                // Si falla → NULL
                DB::table('carta_settings')->where('id', $row->id)
                    ->update(['payment_details' => null]);
            }
        }

        // ─── 2. Restaurar columna con CHECK constraint ─────────────────────────
        DB::statement(
            'ALTER TABLE carta_settings MODIFY COLUMN payment_details longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(payment_details))'
        );
    }
};
