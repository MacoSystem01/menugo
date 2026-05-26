<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;

class AddTenantHost extends Command
{
    protected $signature   = 'tenant:host {subdomain? : Subdominio del restaurante} {--write : Escribe directamente en el archivo hosts (requiere Administrador)}';
    protected $description = 'Agrega la entrada hosts para un subdominio de tenant en Windows';

    private string $hostsFile  = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
    private string $scriptPath = '';

    public function __construct()
    {
        parent::__construct();
        $this->scriptPath = base_path('sync-hosts.ps1');
    }

    public function handle(): void
    {
        $subdomain = $this->argument('subdomain');
        $write     = $this->option('write');

        $baseDomain = parse_url(config('app.url'), PHP_URL_HOST);
        $entries    = $subdomain
            ? ["{$subdomain}.{$baseDomain}"]
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
        return Tenant::withoutTrashed()->with('domains')
            ->get()
            ->flatMap(fn($t) => $t->domains->pluck('domain'))
            ->map(fn($d) => strtolower($d))
            ->unique()
            ->toArray();
    }

    private function writeToHostsFile(array $entries): void
    {
        if (! is_writable($this->hostsFile)) {
            // Generate a PowerShell script the user can run as Administrator
            $this->generatePs1Script();
            $this->error('Sin permisos para escribir en el archivo hosts (Apache no es Administrador).');
            $this->line("Script de sincronización generado en: <comment>{$this->scriptPath}</comment>");
            $this->line('Haz clic derecho sobre ese archivo → <comment>Ejecutar con PowerShell (Administrador)</comment>');
            $this->newLine();
            $this->showInstructions($entries);
            return;
        }

        $current = file_get_contents($this->hostsFile);
        $added   = 0;

        foreach ($entries as $domain) {
            $line = "127.0.0.1 {$domain}";
            if (stripos($current, $domain) !== false) {
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

    private function generatePs1Script(): void
    {
        // Build script that adds all missing tenant domains
        $allDomains = $this->allDomains();

        $lines   = [];
        $lines[] = '# MenuGo — Sincronizar hosts de tenants';
        $lines[] = '# Clic derecho -> "Ejecutar con PowerShell" (acepta el UAC)';
        $lines[] = '# Despues de ejecutar esto UNA VEZ, los proximos tenants se registran automaticamente.';
        $lines[] = '';
        $lines[] = '$hostsFile = "C:\Windows\System32\drivers\etc\hosts"';
        $lines[] = '';
        $lines[] = '# Paso 1: conceder escritura permanente al grupo Users';
        $lines[] = 'Write-Host "Configurando permisos sobre el archivo hosts..." -ForegroundColor Yellow';
        $lines[] = 'icacls $hostsFile /grant "BUILTIN\Users:(W)" | Out-Null';
        $lines[] = 'Write-Host "Listo." -ForegroundColor Green';
        $lines[] = '';
        $lines[] = '# Paso 2: agregar dominios faltantes';
        $lines[] = '$current = Get-Content $hostsFile -Raw';
        $lines[] = '$added   = 0';
        $lines[] = '';

        foreach ($allDomains as $domain) {
            $domain  = strtolower($domain);
            $escaped = addslashes($domain);
            $lines[] = "if (\$current -notmatch [regex]::Escape('{$escaped}')) {";
            $lines[] = "    Add-Content \$hostsFile \"`n127.0.0.1 {$escaped}\"";
            $lines[] = "    Write-Host 'Agregado: 127.0.0.1 {$escaped}' -ForegroundColor Green";
            $lines[] = '    $added++';
            $lines[] = "} else { Write-Host 'Ya existe: {$escaped}' -ForegroundColor DarkGray }";
            $lines[] = '';
        }

        $lines[] = 'Write-Host ""';
        $lines[] = 'if ($added -gt 0) {';
        $lines[] = '    Write-Host "$added dominio(s) agregado(s). Reinicia el navegador." -ForegroundColor Cyan';
        $lines[] = '} else {';
        $lines[] = '    Write-Host "Todos los dominios ya estaban registrados." -ForegroundColor Green';
        $lines[] = '}';
        $lines[] = 'Write-Host ""';
        $lines[] = 'Read-Host "Presiona Enter para cerrar"';

        file_put_contents($this->scriptPath, implode(PHP_EOL, $lines));
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
