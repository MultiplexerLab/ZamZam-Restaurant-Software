<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

class PurchaseSeeder extends Seeder
{
    public function run(): void
    {
        $userId = User::inRandomOrder()->value('id') ?? 1; // fallback to user ID 1

        for ($i = 1; $i <= 100; $i++) {
            Purchase::create([
                'date'        => now()->subDays(rand(0, 365)),
                'title'       => 'Purchase Item ' . $i,
                'cost'        => rand(100, 5000) / 10, // 10.0 – 500.0
                'description' => 'This is a description for purchase item ' . $i,
                'images'      => $this->fakeImages(),
                'created_by'  => $userId,
            ]);
        }
    }

    private function fakeImages(): array
    {
        $images = [];
        $count = rand(1, 3); // 1–3 images per purchase
        for ($i = 0; $i < $count; $i++) {
            $images[] = 'purchases/fake_image_' . uniqid() . '.jpg';
        }
        return $images;
    }
}
