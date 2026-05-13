<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RestaurantTable extends Model
{
    use Auditable;

    protected static function auditLabel(): string { return 'Mesa'; }
    protected function auditDescription(): string  { return "Mesa #{$this->number}"; }
    protected $table = 'restaurant_tables';

    protected $fillable = ['number', 'capacity', 'status', 'qr_code'];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'table_id');
    }

    public function activeOrders(): HasMany
    {
        return $this->orders()->whereNotIn('status', ['delivered', 'cancelled']);
    }
}
