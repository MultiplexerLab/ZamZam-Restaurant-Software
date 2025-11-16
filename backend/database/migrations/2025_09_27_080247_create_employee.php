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
          Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('first_name')->nullable();
            $table->string('first_name_japanese')->nullable();
            $table->string('last_name')->nullable();
            $table->string('last_name_japanese')->nullable();
            $table->text('details')->nullable();
            $table->text('details_japanese')->nullable();
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->string('image')->nullable();
            $table->string('designation')->nullable();
            $table->string('designation_japanese')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->date('joining_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee');
    }
};
