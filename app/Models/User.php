<?php

namespace App\Models;

use App\Traits\Auditable;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasRoles, Auditable;

    protected static function auditLabel(): string { return 'Usuario'; }
    protected function auditDescription(): string  { return "{$this->name} ({$this->email})"; }

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'active',
        // NOTA: 'is_system' NO está en fillable intencionalmente.
        // Solo debe modificarse via forceFill() en seeders/migraciones de sistema.
        // Ningún controlador debe permitir que un usuario externo establezca este flag.
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'active'            => 'boolean',
            'is_system'         => 'boolean',
        ];
    }
}
