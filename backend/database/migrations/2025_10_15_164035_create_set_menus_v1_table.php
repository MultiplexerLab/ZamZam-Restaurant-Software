<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
    {
        Schema::create('set_menus_v1', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('japanese_title')->nullable();
            $table->string('meal_type')->nullable();
            $table->text('description')->nullable();
            $table->decimal('base_price', 8, 2);
            $table->decimal('calculated_base_price', 8, 2)->nullable();
            $table->json('images')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('set_menus_v1');
    }
};
