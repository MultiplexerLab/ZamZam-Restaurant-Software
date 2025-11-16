<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FoodCart extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'food_id', 'set_menu_id', 'quantity',
    ];

    public function food()
    {
        return $this->belongsTo(Food::class);
    }

    public function set_menu()
    {
        return $this->belongsTo(SetMenu::class);
    }
}
