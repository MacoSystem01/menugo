<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('advertising_requests', function (Blueprint $table) {
            // IDs de las entradas creadas al aprobar la solicitud.
            // Permiten evitar duplicados y desactivar al cancelar.
            $table->unsignedBigInteger('advertisement_id')->nullable()->after('activated_at');
            $table->unsignedBigInteger('slider_logo_id')->nullable()->after('advertisement_id');
        });
    }

    public function down(): void
    {
        Schema::table('advertising_requests', function (Blueprint $table) {
            $table->dropColumn(['advertisement_id', 'slider_logo_id']);
        });
    }
};
