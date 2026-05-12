<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('description', 255)->nullable();
            $table->boolean('active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('dishes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('image')->nullable();
            $table->boolean('available')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('restaurant_tables', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('number')->unique();
            $table->unsignedSmallInteger('capacity');
            $table->enum('status', ['available', 'occupied', 'reserved'])->default('available');
            $table->string('qr_code')->nullable()->unique();
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name', 150);
            $table->string('customer_phone', 20);
            $table->enum('type', ['mesa', 'domicilio']);
            $table->foreignId('table_id')->nullable()->constrained('restaurant_tables')->nullOnDelete();
            $table->string('delivery_address')->nullable();
            $table->string('delivery_phone', 20)->nullable();
            $table->enum('status', ['pending','at_cash','in_kitchen','cooking','ready','delivered','cancelled'])->default('pending');
            $table->decimal('total', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('cashier_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('cook_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('delivery_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('ready_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('dish_id')->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->string('notes', 255)->nullable();
            $table->timestamps();
        });

        Schema::create('kitchen_notes', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['quemado', 'cancelado', 'devuelto', 'dañado', 'otro']);
            $table->text('description');
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('dish_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->decimal('quantity', 10, 3);
            $table->string('unit', 30);
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
        Schema::dropIfExists('kitchen_notes');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('restaurant_tables');
        Schema::dropIfExists('dishes');
        Schema::dropIfExists('categories');
    }
};
