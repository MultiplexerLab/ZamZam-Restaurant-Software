<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('food_set_menu', function (Blueprint $table) {
            $table->boolean('is_changeable')->default(false);
            $table->unsignedBigInteger('changeable_category_id')->nullable();
            $table->decimal('additional_cost', 8, 2)->default(0);
            $table->json('exchange_items')->nullable(); // new column
        });
    }

    public function down()
    {
        Schema::table('food_set_menu', function (Blueprint $table) {
            $table->dropColumn(['is_changeable', 'changeable_category_id', 'additional_cost', 'exchange_items']);
        });
    }

};
