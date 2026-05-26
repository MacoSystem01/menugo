<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class CartaSetting extends Model
{
    protected $fillable = [
        'primary_color',
        'bg_color',
        'text_color',
        'logo_size',
        'name_size',
        'slogan',
        'slogan_size',
        'banner_image',
        'social_links',
        'payment_methods',
        'payment_details',
        'delivery_ranges',
        'delivery_enabled',
        'delivery_min_order',
        'delivery_zones',
        'work_schedule',
        'restaurant_lat',
        'restaurant_lng',
        'restaurant_address',
    ];

    protected $casts = [
        'payment_methods'  => 'array',
        // payment_details contiene información bancaria sensible (números de cuenta,
        // titulares, datos de PSE/Nequi/Daviplata) — se almacena ENCRIPTADA con AES-256.
        // La encriptación es transparente: read/write siguen siendo arrays PHP normales.
        // NOTA: si hay datos previos sin encriptar en la BD, el tenant debe re-guardar
        // su configuración de pagos una vez para migrar al nuevo formato seguro.
        'payment_details'  => 'encrypted:array',
        'social_links'     => 'array',
        'delivery_ranges'  => 'array',
        'delivery_enabled' => 'boolean',
        'delivery_zones'   => 'array',
        'work_schedule'    => 'array',
        'restaurant_lat'   => 'float',
        'restaurant_lng'   => 'float',
    ];

    // Ensures firstOrCreate returns sensible values even before the DB row is saved
    protected $attributes = [
        'primary_color'   => '#e85d04',
        'bg_color'        => '#ffffff',
        'text_color'      => '#1a1a1a',
        'logo_size'       => 'md',
        'name_size'       => '2xl',
        'slogan_size'     => 'sm',
        'payment_methods' => '["efectivo"]',
    ];

    public function getBannerUrlAttribute(): ?string
    {
        return $this->banner_image
            ? Storage::disk('public')->url($this->banner_image)
            : null;
    }
}
