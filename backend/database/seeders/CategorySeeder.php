<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Sushi',
                'japanese_name' => '寿司',
                'image' => 'categories/sushi.png',
                'branch_id' => 3, // Tokyo
                'description' => 'Freshly prepared sushi and sashimi.',
                'created_by' => 1,
            ],
            [
                'name' => 'Ramen',
                'japanese_name' => 'ラーメン',
                'image' => 'categories/ramen.png',
                'branch_id' => 3, // Osaka
                'description' => 'Authentic Japanese ramen bowls.',
                'created_by' => 1,
            ],
            [
                'name' => 'Tempura',
                'japanese_name' => '天ぷら',
                'image' => 'categories/tempura.png',
                'branch_id' => 3, // Kyoto
                'description' => 'Crispy and light Japanese tempura.',
                'created_by' => 1,
            ],
            [
                'name' => 'Izakaya',
                'japanese_name' => '居酒屋',
                'image' => 'categories/izakaya.png',
                'branch_id' => 4, // Sapporo
                'description' => 'Japanese bar food and drinks.',
                'created_by' => 1,
            ],
            [
                'name' => 'Yakitori',
                'japanese_name' => '焼き鳥',
                'image' => 'categories/yakitori.png',
                'branch_id' => 4, // Fukuoka
                'description' => 'Grilled chicken skewers and sides.',
                'created_by' => 1,
            ],
            [
                'name' => 'Kaiseki',
                'japanese_name' => '懐石',
                'image' => 'categories/kaiseki.png',
                'branch_id' => 3, // Nagoya
                'description' => 'Traditional multi-course Japanese dining.',
                'created_by' => 1,
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
