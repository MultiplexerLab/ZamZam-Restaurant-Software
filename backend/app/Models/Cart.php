<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    protected $table = 'cart';
    protected $fillable = ['user_id','food_id', 'type','set_menu_id','quantity', 'price', 'spice_level'];

    public function food() { return $this->belongsTo(Food::class); }
    public function set_menu() { return $this->belongsTo(SetMenuV1::class); }
    public function user() { return $this->belongsTo(User::class); }

    public function slots()
    {
        return $this->hasMany(CartSlot::class);
    }
}
