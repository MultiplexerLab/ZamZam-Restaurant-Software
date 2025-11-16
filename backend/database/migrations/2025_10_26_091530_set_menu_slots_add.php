<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('set_menu_slots', function (Blueprint $table) {
            $table->string('spice_level')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('set_menu_slots', function (Blueprint $table) {
            $table->dropColumn('spice_level');
        });
    }
};
