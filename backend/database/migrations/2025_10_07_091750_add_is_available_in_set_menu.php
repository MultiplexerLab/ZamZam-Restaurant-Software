<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('set_menus', function (Blueprint $table) {
            $table->boolean('is_available')->default(0)->nullable(); // cash / card
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('set_menus', function (Blueprint $table) {
            $table->dropColumn('is_available');
        });
    }
};
