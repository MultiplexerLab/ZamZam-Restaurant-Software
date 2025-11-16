<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SetMenuV1 extends Model
{
    use HasFactory;

    protected $table = 'set_menus_v1';

    protected $fillable = [
        'branch_id',
        'title',
        'japanese_title',
        'meal_type',
        'description',
        'jp_description',
        'base_price', // price of the set menu
        'created_by',
        'is_available',
        'is_takeout_menu',
        'calculated_base_price',
        'images',
    ];

    protected $casts = [
        'images' => 'array'
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Slots of this set menu
    public function slots()
    {
        return $this->hasMany(SetMenuSlot::class, 'set_menu_id');
    }

    public function calculateSetMenuPrice(SetMenuV1 $setMenu, array $userSelections)
    {
        // Base price of the set menu
        $totalPrice = $setMenu->base_price;

        foreach ($setMenu->slots as $slot) {
            // Check if the slot is changeable
            if ($slot->type === 'changeable') {
                // Get user-selected food for this slot
                $selectedFoodId = $userSelections[$slot->id] ?? null;
                if ($selectedFoodId && $selectedFoodId != $slot->default_food_id) {
                    $totalPrice += $slot->additional_price;
                }
            }
        }

        return $totalPrice;
    }
}
