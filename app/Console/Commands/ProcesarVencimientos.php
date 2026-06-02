<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ProcesarVencimientos extends Command
{
    protected $signature   = 'app:procesar-vencimientos';
    protected $description = 'Marca como overdue los tenants con plan vencido y desactiva su acceso';

    public function handle(): int
    {
        $tenants = Tenant::withoutTrashed()
            ->whereNotIn('plan', ['starter'])
            ->whereIn('payment_status', ['paid', 'trial'])
            ->get();

        $vencidos = 0;

        foreach ($tenants as $tenant) {
            $expiresAt = $tenant->expires_at;
            if (!$expiresAt) continue;

            $expiry = Carbon::parse($expiresAt);

            if (now()->isAfter($expiry)) {
                if ($tenant->payment_status === 'paid') {
                    $tenant->update([
                        'payment_status' => 'overdue',
                        'active'         => false,
                    ]);
                    $vencidos++;
                    $this->line("[VENCIDO] {$tenant->name} — venció el {$expiry->format('Y-m-d')}");
                }

                if ($tenant->payment_status === 'trial') {
                    $tenant->update([
                        'payment_status' => 'pending_payment',
                        'active'         => false,
                    ]);
                    $vencidos++;
                    $this->line("[TRIAL VENCIDO] {$tenant->name} — trial venció el {$expiry->format('Y-m-d')}");
                }
            }
        }

        $this->info("Procesados: {$vencidos} vencido(s).");
        return self::SUCCESS;
    }
}
