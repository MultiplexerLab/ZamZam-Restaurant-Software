<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // --- Create Admin User ---
        User::firstOrCreate(
            ['email' => 'admin@zamzam.jp'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        // --- Create Cashier User ---
        User::firstOrCreate(
            ['email' => 'cashier@zamzam.jp'],
            [
                'name' => 'Cashier User',
                'password' => Hash::make('password'),
                'role' => 'cashier',
            ]
        );
        // --- Create Cashier User ---
        User::firstOrCreate(
            ['email' => 'user@zamzam.jp'],
            [
                'name' => 'Cashier User',
                'password' => Hash::make('password'),
                'role' => 'employee',
            ]
        );

         User::firstOrCreate(
            ['email' => 'kitchen@zamzam.jp'],
            [
                'name' => 'Cashier User',
                'password' => Hash::make('password'),
                'role' => 'kichen',
            ]
        );
    }
}
