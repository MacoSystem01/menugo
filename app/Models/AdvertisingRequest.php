<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class AdvertisingRequest extends Model
{
    protected $fillable = [
        'type',
        'tenant_id',
        'business_name',
        'contact_name',
        'contact_email',
        'contact_phone',
        'image_path',
        'ai_enhanced',
        'payment_proof_path',
        'payment_proof_at',
        'status',
        'admin_notes',
        'activated_at',
        'advertisement_id',
        'slider_logo_id',
    ];

    protected $casts = [
        'ai_enhanced'      => 'boolean',
        'payment_proof_at' => 'datetime',
        'activated_at'     => 'datetime',
    ];

    // ── Accessors ──────────────────────────────────────────────────────────────

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path
            ? Storage::disk('public')->url($this->image_path)
            : null;
    }

    public function getProofUrlAttribute(): ?string
    {
        return $this->payment_proof_path
            ? Storage::disk('public')->url($this->payment_proof_path)
            : null;
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    public static function prices(): array
    {
        return ['banner' => 20000, 'slider' => 10000, 'combo' => 25000];
    }

    public static function labels(): array
    {
        return ['banner' => 'Banner Principal', 'slider' => 'Slider de Negocios', 'combo' => 'Combo'];
    }
}
