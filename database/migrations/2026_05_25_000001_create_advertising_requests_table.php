<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('advertising_requests', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['banner', 'slider', 'combo']);

            // Restaurante asociado (opcional — puede no estar en la plataforma aún)
            $table->string('tenant_id')->nullable()->index();

            $table->string('business_name');
            $table->string('contact_name');
            $table->string('contact_email');
            $table->string('contact_phone', 30)->nullable();

            // Material publicitario
            $table->string('image_path')->nullable();
            $table->boolean('ai_enhanced')->default(false);

            // Comprobante de pago
            $table->string('payment_proof_path')->nullable();
            $table->timestamp('payment_proof_at')->nullable();

            // Estado: pending_payment → pending_review → active | rejected
            $table->enum('status', ['pending_payment', 'pending_review', 'active', 'rejected'])
                  ->default('pending_payment');

            $table->text('admin_notes')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('advertising_requests');
    }
};
