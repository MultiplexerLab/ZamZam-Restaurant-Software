<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id','first_name','first_name_japanese','last_name','last_name_japanese',
        'details','details_japanese','branch_id','image','designation',
        'designation_japanese','date_of_birth','joining_date'
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function branch() {
        return $this->belongsTo(Branch::class);
    }
}

