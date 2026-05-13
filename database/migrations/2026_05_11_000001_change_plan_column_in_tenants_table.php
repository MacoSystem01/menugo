<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE `tenants` MODIFY COLUMN `plan` VARCHAR(30) NOT NULL DEFAULT 'mensual'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE `tenants` MODIFY COLUMN `plan` ENUM('basico','pro','enterprise') NOT NULL DEFAULT 'basico'");
    }
};
