<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformPaymentMethod extends Model
{
    protected $table = 'platform_payment_methods';

    protected $fillable = [
        'name',
        'account_info',
        'instructions',
        'active',
        'sort_order',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('active', true)->orderBy('sort_order')->orderBy('id');
    }
}
