<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {

        Schema::create('food_exchange_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('set_menu_id');
            $table->unsignedBigInteger('food_id');
            $table->unsignedBigInteger('exchange_food_id');
            $table->decimal('additional_price', 8, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('food_exchange_items');
    }
};
