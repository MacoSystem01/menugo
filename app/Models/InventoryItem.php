<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    use Auditable;

    protected static function auditLabel(): string { return 'Inventario'; }
    protected function auditDescription(): string  { return $this->name; }

    protected $table = 'inventory_items';

    protected $fillable = [
        'name', 'quantity', 'unit',
        'unit_price', 'status',
        'expiry_date', 'notes',
    ];

    protected $casts = [
        'quantity'    => 'decimal:3',
        'unit_price'  => 'decimal:2',
        'total_value' => 'decimal:2',
        'expiry_date' => 'date',
    ];
}
