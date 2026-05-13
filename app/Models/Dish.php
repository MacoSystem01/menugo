<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dish extends Model
{
    use Auditable;

    protected static function auditLabel(): string { return 'Plato'; }
    protected $fillable = ['category_id', 'name', 'description', 'price', 'image', 'available', 'sort_order'];

    protected $casts = [
        'price'     => 'decimal:2',
        'available' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
