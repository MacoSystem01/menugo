<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains, SoftDeletes;

    public static function getCustomColumns(): array
    {
        // Todas las columnas reales de la tabla + datos en JSON 'data':
        // Las columnas aquí listadas son columnas REALES de la tabla tenants.
        // Los campos almacenados en 'data' (JSON) son: active, type, expires_at, phone
        // Stancl los maneja automáticamente vía __get/__set en el JSON data field.
        return ['id', 'name', 'owner_name', 'email', 'address', 'plan', 'tier', 'billing_cycle', 'payment_status', 'payment_evidence_path', 'payment_evidence_at', 'deleted_at'];
    }

    /**
     * Revisa si el tenant tiene acceso a una característica específica según su nivel (tier).
     */
    public function hasFeature(string $feature): bool
    {
        $tier = $this->tier ?? 'starter';
        return \App\Services\FeaturePlanService::hasFeature($tier, $feature);
    }
}
