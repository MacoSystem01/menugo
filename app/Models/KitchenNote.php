<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KitchenNote extends Model
{
    use Auditable;

    protected static function auditLabel(): string { return 'Novedad'; }
    protected function auditDescription(): string  { return "Novedad #{$this->id} ({$this->type})"; }

    protected $fillable = ['type', 'description', 'order_id', 'dish_id', 'created_by', 'verified_at', 'verified_by'];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function dish(): BelongsTo
    {
        return $this->belongsTo(Dish::class)->withTrashed();
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
