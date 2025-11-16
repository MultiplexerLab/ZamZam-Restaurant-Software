<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    protected $table = "purchases";

    use HasFactory;

    protected $fillable = [
        'date',
        'title',
        'cost',
        'description',
        'images',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'images' => 'array',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getImageUrlsAttribute()
    {
        if (!$this->images) return [];
        return array_map(fn ($img) => asset('storage/' . $img), $this->images);
    }
}
