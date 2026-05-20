<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;

class AddTenantHost extends Command
{
    protected $signature   = 'tenant:host {subdomain? : Subdominio del restaurante} {--write : Escribe directamente en el archivo hosts (requiere Administrador)}';
    protected $description = 'Agrega la entrada hosts para un subdominio de tenant en Windows';

    private string $hostsFile = 'C:\\Windows\\System32\\drivers\\etc\\hosts';

    public function handle(): void
    {
        $subdomain = $this->argument('subdomain');
        $write     = $this->option('write');

        $entries = $subdomain
            ? ["{$subdomain}.Menugo.local"]
            : $this->allDomains();

        if (empty($entries)) {
            $this->warn('No hay tenants registrados aún.');
            return;
        }

        if ($write) {
            $this->writeToHostsFile($entries);
        } else {
            $this->showInstructions($entries);
        }
    }

    private function allDomains(): array
    {
        return Tenant::with('domains')
            ->get()
            ->flatMap(fn($t) => $t->domains->pluck('domain'))
            ->toArray();
    }

    private function writeToHostsFile(array $entries): void
    {
        if (! is_writable($this->hostsFile)) {
            $this->error('Sin permisos para escribir en el archivo hosts.');
            $this->line('Ejecuta este comando desde una terminal con privilegios de Administrador.');
            $this->newLine();
            $this->showInstructions($entries);
            return;
        }

        $current = file_get_contents($this->hostsFile);
        $added   = 0;

        foreach ($entries as $domain) {
            $line = "127.0.0.1 {$domain}";
            if (str_contains($current, $domain)) {
                $this->line("<comment>Ya existe:</comment> {$line}");
                continue;
            }
            file_put_contents($this->hostsFile, PHP_EOL . $line, FILE_APPEND);
            $this->line("<info>Agregado:</info>    {$line}");
            $added++;
        }

        if ($added > 0) {
            $this->newLine();
            $this->info("✓ {$added} entrada(s) agregada(s). Reinicia el navegador para aplicar los cambios.");
        }
    }

    private function showInstructions(array $entries): void
    {
        $this->line('Agrega estas líneas al archivo hosts como Administrador:');
        $this->newLine();
        foreach ($entries as $domain) {
            $this->line("  127.0.0.1 {$domain}");
        }
        $this->newLine();
        $this->comment('Ruta: C:\Windows\System32\drivers\etc\hosts');
        $this->newLine();
        $this->comment('Opción rápida (PowerShell como Administrador):');
        foreach ($entries as $domain) {
            $this->line("  Add-Content 'C:\\Windows\\System32\\drivers\\etc\\hosts' \"`n127.0.0.1 {$domain}\"");
        }
    }
}
