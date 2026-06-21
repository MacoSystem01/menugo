<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Order extends Model
{
    use Auditable;

    protected static function auditLabel(): string { return 'Pedido'; }
    protected function auditDescription(): string  { return "Pedido #{$this->id}"; }

    protected array $auditHidden = ['closed_at_eod'];

    protected $fillable = [
        'customer_name', 'customer_phone',
        'type', 'turn_number', 'table_id', 'tracking_token',
        'delivery_address', 'delivery_phone', 'delivery_fee',
        'payment_method',
        'status', 'total', 'amount_paid', 'payment_reported_at', 'notes',
        'cashier_id', 'cook_id', 'delivery_user_id',
        'ready_at', 'delivered_at', 'closed_at_eod',
    ];

    protected $casts = [
        'total'               => 'decimal:2',
        'amount_paid'         => 'decimal:2',
        'ready_at'            => 'datetime',
        'delivered_at'        => 'datetime',
        'closed_at_eod'       => 'datetime',
        'payment_reported_at' => 'datetime',
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
        // Suma todos los ítems (quantity × unit_price) y suma el delivery_fee si aplica.
        // delivery_fee es propio del pedido y no está en order_items.
        $itemsTotal  = $this->items()->sum(DB::raw('quantity * unit_price'));
        $this->total = $itemsTotal + (float) ($this->delivery_fee ?? 0);
        $this->save();
    }
}
