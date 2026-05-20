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
    ];

    protected $casts = [
        'payment_methods'  => 'array',
        'payment_details'  => 'array',
        'social_links'     => 'array',
        'delivery_ranges'  => 'array',
        'delivery_enabled' => 'boolean',
        'delivery_zones'   => 'array',
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
