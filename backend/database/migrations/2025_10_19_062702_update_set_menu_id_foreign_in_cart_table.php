<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cart', function (Blueprint $table) {
            // Drop existing foreign key first
            $table->dropForeign(['set_menu_id']);

            // Update foreign key to point to set_menu_v1 table
            $table->foreign('set_menu_id')
                ->references('id')
                ->on('set_menus_v1')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('cart', function (Blueprint $table) {
            // Drop updated foreign key
            $table->dropForeign(['set_menu_id']);

            // Restore original foreign key (pointing to set_menus)
            $table->foreign('set_menu_id')
                ->references('id')
                ->on('set_menus')
                ->onDelete('cascade');
        });
    }
};
