<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // pending_payment: registrado, sin evidencia — espera 24h
            // pending_review:  registrado, con evidencia — espera 6h
            // active:          pago confirmado por el admin
            $table->string('payment_status', 20)->default('active')->after('plan');
            $table->string('payment_evidence_path')->nullable()->after('payment_status');
            $table->timestamp('payment_evidence_at')->nullable()->after('payment_evidence_path');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'payment_evidence_path', 'payment_evidence_at']);
        });
    }
};
