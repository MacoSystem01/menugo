<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('name');               // Ej: "Nequi", "Bancolombia PSE"
            $table->string('account_info');        // Número, correo o alias de la cuenta
            $table->text('instructions')->nullable(); // Instrucciones adicionales al usuario
            $table->boolean('active')->default(true);
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_payment_methods');
    }
};
