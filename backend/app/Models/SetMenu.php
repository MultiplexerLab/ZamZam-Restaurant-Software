<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SetMenu extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'category_id',
        'title',
        'meal_type',
        'japanese_title',
        'foods_item',
        'is_available',
        'calculated_cost',
        'cost',
        'description',
        'images',
        'created_by'
    ];

    protected $casts = [
        'foods_item' => 'array',
        'images' => 'array',
    ];

    // Append custom attribute for frontend convenience
    protected $appends = ['food_names'];

    /**
     * Creator relationship
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Branch relationship
     */
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Category relationship
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get full image URLs
     */
    public function getImageUrlsAttribute()
    {
        if (!$this->images) return [];
        return array_map(fn ($img) => asset('storage/' . $img), $this->images);
    }

    /**
     * Get Food models based on foods_item array
     */
    public function getFoodNamesAttribute()
    {
        if (!$this->foods_item) return collect();
        return \App\Models\Food::whereIn('id', $this->foods_item)->get();
    }

    public function foods()
    {
        return $this->belongsToMany(Food::class, 'food_set_menu', 'set_menu_id', 'food_id')
            ->withPivot('is_changeable', 'additional_cost', 'changeable_category_id', 'exchange_items') // include exchange_items
            ->withTimestamps();
    }


    public function getFoodsWithExchangeItemsAttribute()
    {
        return $this->foods->map(function ($food) {
            $food->pivot->exchange_items = $food->pivot->exchange_items
                ? json_decode($food->pivot->exchange_items, true)
                : [];
            return $food;
        });
    }

}
