<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use Auditable;

    protected static function auditLabel(): string { return 'Categoría'; }
    protected $fillable = ['name', 'description', 'active', 'sort_order'];

    protected $casts = ['active' => 'boolean'];

    public function dishes(): HasMany
    {
        return $this->hasMany(Dish::class);
    }
}
