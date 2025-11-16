<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Food extends Model
{
    use HasFactory;

    protected $table = 'foods';

    protected $fillable = [
        'branch_id',
        'category_id',
        'meal_type',
        'name',
        'japanese_name',
        'images', // changed from 'image' to 'images'
        'price',
        'description',
        'jp_description',
        'is_available',
        'is_takeout_menu',
        'created_by',
        'spice_level',
        'set_menu_image'
    ];

    // Cast JSON column to array automatically
    protected $casts = [
        'images' => 'array',
        'is_available' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Helper to get full URLs for all images
    public function getImageUrlsAttribute()
    {
        if (! $this->images) return [];
        return array_map(fn($img) => asset('storage/' . $img), $this->images);
    }
}

