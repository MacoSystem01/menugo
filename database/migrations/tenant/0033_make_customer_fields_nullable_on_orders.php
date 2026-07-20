<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Hace nullable customer_name y customer_phone en orders.
     *
     * Motivation: se añadieron los tipos "Mostrador" y "Mesa" para Puestos
     * de Comida Rápida. El pedido de Mesa no requiere nombre ni teléfono
     * del cliente (solo número de mesa). El pedido de Mostrador no requiere
     * teléfono. La constraint NOT NULL de la migración original bloqueaba
     * el INSERT cuando estos campos venían vacíos.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('customer_name', 150)->nullable()->change();
            $table->string('customer_phone', 20)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Restaura NOT NULL; asigna '' como default temporal para filas existentes
            $table->string('customer_name', 150)->nullable(false)->default('')->change();
            $table->string('customer_phone', 20)->nullable(false)->default('')->change();
        });
    }
};
