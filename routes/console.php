<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Cierre automático de día a medianoche para todos los tenants.
// En Windows (XAMPP) se necesita una tarea en el Programador de tareas que ejecute
// cada minuto: php C:\xampp\htdocs\Menugo\artisan schedule:run
Schedule::command('app:cierre-diario')
    ->dailyAt('00:00')
    ->withoutOverlapping()
    ->runInBackground();
