<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('action', 30);                    // 'delete'
            $table->string('auditable_type', 60);            // 'Usuario', 'Plato', etc.
            $table->unsignedBigInteger('auditable_id');
            $table->string('description', 300);              // nombre/resumen del registro eliminado
            $table->foreignId('causer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('causer_name', 150);              // snapshot del nombre
            $table->json('properties')->nullable();          // snapshot completo del registro
            $table->timestamps();

            $table->index(['action', 'auditable_type']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
