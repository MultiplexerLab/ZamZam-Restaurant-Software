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
        Schema::create('food_set_menu', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('set_menu_id');
            $table->unsignedBigInteger('food_id');
            $table->timestamps();

            $table->foreign('set_menu_id')->references('id')->on('set_menus')->onDelete('cascade');
            $table->foreign('food_id')->references('id')->on('foods')->onDelete('cascade');

            $table->unique(['set_menu_id', 'food_id']); // prevent duplicates
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_set_menu');
    }
};
