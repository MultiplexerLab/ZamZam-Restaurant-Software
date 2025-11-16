<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoodExchangeItem extends Model
{
    protected $fillable = [
        'set_menu_id',
        'food_id',
        'exchange_food_id',
        'additional_price',
    ];

    /**
     * Relation to get the actual food being used as exchange
     */
    public function exchangeFood()
    {
        return $this->belongsTo(Food::class, 'exchange_food_id');
    }
}
