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
         Schema::create('set_menus', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->string('japanese_title')->nullable();
            $table->json('foods_item')->nullable(); // store selected food IDs as array
            $table->decimal('calculated_cost', 10, 2)->default(0);
            $table->decimal('cost', 10, 2)->default(0);
            $table->text('description')->nullable();
            $table->json('images')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
         Schema::dropIfExists('set_menus');
    }
};
