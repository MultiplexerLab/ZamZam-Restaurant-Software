<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CartSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'cart_id',
        'slot_id',
        'food_id',
        'spice_level'
    ];

    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    public function slot()
    {
        return $this->belongsTo(SetMenuSlot::class);
    }

    public function food()
    {
        return $this->belongsTo(Food::class);
    }
}
