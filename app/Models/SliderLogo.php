<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class SliderLogo extends Model
{
    protected $fillable = ['image_path', 'business_name', 'sort_order', 'active'];

    protected $casts = ['active' => 'boolean'];

    public function getImageUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->image_path);
    }
}
