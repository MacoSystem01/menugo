<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KitchenNote extends Model
{
    protected $fillable = ['type', 'description', 'order_id', 'dish_id', 'created_by'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function dish(): BelongsTo
    {
        return $this->belongsTo(Dish::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
