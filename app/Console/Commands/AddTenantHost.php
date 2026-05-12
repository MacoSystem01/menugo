<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;

class AddTenantHost extends Command
{
    protected $signature = 'tenant:host {subdomain? : Subdominio del restaurante}';
    protected $description = 'Muestra la entrada hosts para agregar un subdominio de tenant en Windows';

    public function handle(): void
    {
        $subdomain = $this->argument('subdomain');

        if (!$subdomain) {
            $tenants = Tenant::with('domains')->get();
            if ($tenants->isEmpty()) {
                $this->warn('No hay tenants registrados aún.');
                return;
            }

            $this->info('Entradas para agregar a C:\Windows\System32\drivers\etc\hosts:');
            $this->newLine();
            foreach ($tenants as $tenant) {
                foreach ($tenant->domains as $domain) {
                    $this->line("127.0.0.1 {$domain->domain}    # {$tenant->name}");
                }
            }
        } else {
            $this->info('Agrega esta línea al archivo hosts (como Administrador):');
            $this->newLine();
            $this->line("127.0.0.1 {$subdomain}.menugo.local");
        }

        $this->newLine();
        $this->comment('Ruta del archivo: C:\Windows\System32\drivers\etc\hosts');
        $this->comment('Abre el Bloc de notas como Administrador para editarlo.');
    }
}
