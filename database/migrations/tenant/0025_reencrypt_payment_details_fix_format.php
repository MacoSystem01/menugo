<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/**
 * Corrige el formato de encriptación de payment_details.
 *
 * Migración 0024 usó Crypt::encrypt($array, serialize=true).
 * El cast encrypted:array de Laravel 11 espera Crypt::encryptString(json_encode($array))
 * (serialize=false + JSON).
 *
 * Esta migración re-encripta los valores existentes al formato correcto.
 */
return new class extends Migration
{
    public function up(): void
    {
        $rows = DB::table('carta_settings')->whereNotNull('payment_details')->get();

        foreach ($rows as $row) {
            $value = $row->payment_details;

            // Intentar descifrar con serialize=true (formato incorrecto de 0024)
            $arrayData = null;
            try {
                $candidate = Crypt::decrypt($value, true); // PHP unserialize
                if (is_array($candidate)) {
                    $arrayData = $candidate;
                }
            } catch (\Throwable) {}

            // Si no funcionó serialize=true, intentar con serialize=false + json_decode
            if ($arrayData === null) {
                try {
                    $jsonStr  = Crypt::decrypt($value, false);
                    $candidate = json_decode($jsonStr, true);
                    if (is_array($candidate)) {
                        // Ya está en el formato correcto — no re-encriptar
                        continue;
                    }
                } catch (\Throwable) {}
            }

            // Si se pudo obtener el array, re-encriptar en formato correcto
            if (is_array($arrayData)) {
                $correct = Crypt::encryptString(json_encode($arrayData));
                DB::table('carta_settings')->where('id', $row->id)
                    ->update(['payment_details' => $correct]);
            } else {
                // No se pudo descifrar en ningún formato → NULL
                DB::table('carta_settings')->where('id', $row->id)
                    ->update(['payment_details' => null]);
            }
        }
    }

    public function down(): void
    {
        // No hay rollback útil para un cambio de formato;
        // down() de 0024 maneja la restauración completa.
    }
};
