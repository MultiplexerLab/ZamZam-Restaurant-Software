<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SetMenuSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'set_menu_id',
        'category_id',
        'type', // 'changeable', 'choosable', or 'other'
        'default_food_id',
        'quantity',
        'additional_price', // Admin-defined extra cost
        'spice_level'
    ];

    // In SetMenuSlot.php
    protected $casts = [
        'other_foods' => 'array',
    ];

    public function setMenu()
    {
        return $this->belongsTo(SetMenuV1::class, 'set_menu_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function defaultFood()
    {
        return $this->belongsTo(Food::class, 'default_food_id');
    }

    public function foods()
    {
        // All foods in this category
        return $this->hasMany(Food::class, 'category_id', 'category_id');
    }

    // Helper: check if this slot is an additional selectable food
    public function isAdditionalFood()
    {
        return $this->type === 'other';
    }


}
