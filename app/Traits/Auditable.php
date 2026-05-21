<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

trait Auditable
{
    protected static function bootAuditable(): void
    {
        static::created(fn(Model $m) => static::writeAuditLog('create', $m));
        static::updated(fn(Model $m) => static::writeAuditLog('update', $m));
        static::deleted(fn(Model $m) => static::writeAuditLog('delete', $m));
    }

    private static function writeAuditLog(string $action, Model $model): void
    {
        if (! auth()->check()) return;

        $hidden = array_merge(
            ['password', 'remember_token', 'updated_at'],
            property_exists($model, 'auditHidden') ? $model->auditHidden : []
        );

        if ($action === 'update') {
            $dirty = array_diff_key($model->getDirty(), array_flip($hidden));
            if (empty($dirty)) return;

            $properties = [
                'old' => array_diff_key(
                    array_intersect_key($model->getOriginal(), $dirty),
                    array_flip($hidden)
                ),
                'new' => $dirty,
            ];
        } elseif ($action === 'delete') {
            $properties = array_diff_key($model->toArray(), array_flip($hidden));
        } else {
            $properties = null;
        }

        try {
            AuditLog::create([
                'action'         => $action,
                'auditable_type' => static::auditLabel(),
                'auditable_id'   => $model->getKey(),
                'description'    => $model->auditDescription(),
                'causer_id'      => auth()->id(),
                'causer_name'    => auth()->user()->name,
                'properties'     => $properties ?: null,
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            // causer_id del contexto central no existe en esta DB de tenant — se omite el log
            if ($e->getCode() === '23000') return;
            throw $e;
        }
    }

    protected static function auditLabel(): string
    {
        return class_basename(static::class);
    }

    protected function auditDescription(): string
    {
        return $this->name ?? (string) $this->getKey();
    }
}
