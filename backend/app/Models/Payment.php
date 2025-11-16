<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'table_number', 'total_amount', 'discount', 'paid_amount',
        'payment_method', 'card_number', 'orders'
    ];

    protected $casts = [
        'orders' => 'array',
    ];
}
