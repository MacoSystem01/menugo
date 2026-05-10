<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->decimal('quantity', 10, 3);
            $table->string('unit', 30);          // kg, L, und, cajas, etc.
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_value', 12, 2)->storedAs('quantity * unit_price');
            $table->enum('status', ['ok', 'bajo', 'agotado', 'vencido'])->default('ok');
            $table->date('expiry_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
