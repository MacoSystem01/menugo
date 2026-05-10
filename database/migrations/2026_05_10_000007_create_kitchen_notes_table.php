<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kitchen_notes', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['quemado', 'cancelado', 'devuelto', 'dañado', 'otro']);
            $table->text('description');
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('dish_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kitchen_notes');
    }
};
