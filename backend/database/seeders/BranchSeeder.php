<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = [
            [
                'name' => 'Tokyo',
                'japanese_name' => '東京',
                'location' => 'Tokyo, Japan',
                'image' => 'branches/tokyo.png',
                'created_by' => 1, // adjust to a valid user_id
            ],
            [
                'name' => 'Osaka',
                'japanese_name' => '大阪',
                'location' => 'Osaka, Japan',
                'image' => 'branches/osaka.png',
                'created_by' => 1,
            ],
            [
                'name' => 'Kyoto',
                'japanese_name' => '京都',
                'location' => 'Kyoto, Japan',
                'image' => 'branches/kyoto.png',
                'created_by' => 1,
            ],
            [
                'name' => 'Sapporo',
                'japanese_name' => '札幌',
                'location' => 'Hokkaido, Japan',
                'image' => 'branches/sapporo.png',
                'created_by' => 1,
            ],
            [
                'name' => 'Fukuoka',
                'japanese_name' => '福岡',
                'location' => 'Fukuoka, Japan',
                'image' => 'branches/fukuoka.png',
                'created_by' => 1,
            ],
            [
                'name' => 'Nagoya',
                'japanese_name' => '名古屋',
                'location' => 'Aichi, Japan',
                'image' => 'branches/nagoya.png',
                'created_by' => 1,
            ],
        ];

        foreach ($branches as $branch) {
            Branch::create($branch);
        }
    }
}
