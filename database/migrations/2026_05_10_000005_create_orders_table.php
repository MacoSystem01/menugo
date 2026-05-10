<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            // Cliente
            $table->string('customer_name', 150);
            $table->string('customer_phone', 20);

            // Tipo de pedido
            $table->enum('type', ['mesa', 'domicilio']);
            $table->foreignId('table_id')
                  ->nullable()
                  ->constrained('restaurant_tables')
                  ->nullOnDelete();

            // Datos domicilio (solo si type = domicilio)
            $table->string('delivery_address')->nullable();
            $table->string('delivery_phone', 20)->nullable();

            // Estado — flujo completo del pedido
            $table->enum('status', [
                'pending',      // creado vía QR, sin pagar
                'at_cash',      // enviado a caja
                'in_kitchen',   // pago aprobado, en cola cocina
                'cooking',      // cocina pulsó "A Cocinar"
                'ready',        // cocina pulsó "Entregado" (listo para mesa/domicilio)
                'delivered',    // entregado al cliente
                'cancelled',
            ])->default('pending');

            $table->decimal('total', 10, 2)->default(0);
            $table->text('notes')->nullable();

            // Trazabilidad
            $table->foreignId('cashier_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('cook_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('delivery_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamp('ready_at')->nullable();     // cuándo pasó a ready
            $table->timestamp('delivered_at')->nullable(); // cuándo fue marcado entregado

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
