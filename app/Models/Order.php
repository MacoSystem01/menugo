<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'customer_name', 'customer_phone',
        'type', 'table_id',
        'delivery_address', 'delivery_phone',
        'status', 'total', 'notes',
        'cashier_id', 'cook_id', 'delivery_user_id',
        'ready_at', 'delivered_at',
    ];

    protected $casts = [
        'total'        => 'decimal:2',
        'ready_at'     => 'datetime',
        'delivered_at' => 'datetime',
    ];

    // ── Relaciones ─────────────────────────────────────────────────────────────

    public function table(): BelongsTo
    {
        return $this->belongsTo(RestaurantTable::class, 'table_id');
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function cook(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cook_id');
    }

    public function deliveryUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delivery_user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function kitchenNotes(): HasMany
    {
        return $this->hasMany(KitchenNote::class);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    public function isDeliverable(): bool
    {
        if ($this->status !== 'ready') return false;
        if ($this->type === 'mesa') return true;
        return $this->type === 'domicilio';
    }

    public function recalculateTotal(): void
    {
        $this->total = $this->items()->sum(\DB::raw('quantity * unit_price'));
        $this->save();
    }
}
