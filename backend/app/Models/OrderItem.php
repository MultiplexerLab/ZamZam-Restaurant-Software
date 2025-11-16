<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = ['order_id','food_id','set_menu_id','name','japanese_name','price','quantity','meta', 'spice_level'];
    protected $casts = ['meta'=>'array'];
    public function order() { return $this->belongsTo(Order::class); }
}

