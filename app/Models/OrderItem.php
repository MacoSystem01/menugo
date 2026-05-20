<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = ['order_id', 'dish_id', 'quantity', 'unit_price', 'notes', 'is_addition', 'is_cooked', 'is_prepared'];

    protected $casts = ['unit_price' => 'decimal:2', 'is_addition' => 'boolean', 'is_cooked' => 'boolean', 'is_prepared' => 'boolean'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function dish(): BelongsTo
    {
        return $this->belongsTo(Dish::class);
    }

    public function subtotal(): float
    {
        return $this->quantity * $this->unit_price;
    }
}
