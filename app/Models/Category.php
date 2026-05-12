<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = ['name', 'description', 'active', 'sort_order'];

    protected $casts = ['active' => 'boolean'];

    public function dishes(): HasMany
    {
        return $this->hasMany(Dish::class);
    }
}
