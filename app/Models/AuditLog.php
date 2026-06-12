<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $fillable = [
        'action', 'auditable_type', 'auditable_id',
        'description', 'causer_id', 'causer_name', 'properties',
    ];

    protected $casts = ['properties' => 'encrypted:array'];

    public function causer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'causer_id');
    }

    // Llamada manual desde controladores para registrar eventos de negocio.
    public static function registrar(
        string $action,
        string $type,
        int|string|null $typeId,
        string $description,
        ?array $properties = null
    ): void {
        if (! auth()->check()) return;

        static::create([
            'action'         => $action,
            'auditable_type' => $type,
            'auditable_id'   => $typeId,
            'description'    => $description,
            'causer_id'      => auth()->id(),
            'causer_name'    => auth()->user()->name,
            'properties'     => $properties,
        ]);
    }
}
