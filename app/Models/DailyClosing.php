<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyClosing extends Model
{
    protected $fillable = ['closed_at', 'orders_cancelled', 'tables_freed'];

    protected $casts = [
        'closed_at' => 'datetime',
    ];
}
