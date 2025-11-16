<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
    {
        Schema::create('set_menu_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('set_menu_id')->constrained('set_menus_v1')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['changeable', 'choosable', 'fixed', 'other']);
            $table->foreignId('default_food_id')->nullable()->constrained('foods');
            $table->integer('quantity')->default(1);
            $table->decimal('additional_price', 8, 2)->default(0); // admin-set extra cost
            $table->json('additional_foods')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('set_menu_slots');
    }
};
