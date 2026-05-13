<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carta_settings', function (Blueprint $table) {
            $table->id();
            $table->string('primary_color', 7)->default('#e85d04');
            $table->string('bg_color', 7)->default('#ffffff');
            $table->string('text_color', 7)->default('#1a1a1a');
            $table->string('logo_size', 10)->default('md');
            $table->string('name_size', 10)->default('2xl');
            $table->string('slogan', 200)->nullable();
            $table->string('slogan_size', 10)->default('sm');
            $table->string('banner_image')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carta_settings');
    }
};
