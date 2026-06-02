<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use Stancl\Tenancy\Contracts\TenantWithDatabase;

class SeedTenantDatabase implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected TenantWithDatabase $tenant) {}

    public function handle(): void
    {
        // --force evita que la consola pida confirmación interactiva (STDIN no existe en web)
        Artisan::call('tenants:seed', [
            '--tenants' => [$this->tenant->getTenantKey()],
            '--force'   => true,
        ]);
    }
}
