<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    protected $table = 'inventory_items';

    protected $fillable = [
        'name', 'quantity', 'unit',
        'unit_price', 'status',
        'expiry_date', 'notes',
    ];

    protected $casts = [
        'quantity'    => 'decimal:3',
        'unit_price'  => 'decimal:2',
        'expiry_date' => 'date',
    ];
}
