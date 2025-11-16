<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SetMenu;
use App\Models\Food;
use App\Models\User;

class SetMenuSeeder extends Seeder
{
    public function run(): void
    {
        $userId = User::inRandomOrder()->value('id') ?? 1;
        $branchId = 2; // stick to branch_id = 2
        $categoryId = 1; // adjust if you have a category for set menus

        $foods = Food::where('branch_id', $branchId)->get();

        if ($foods->count() < 3) {
            $this->command->warn('Not enough food items to create 10 set menus (need at least 30).');
            return;
        }

        for ($i = 1; $i <= 10; $i++) {
            // randomly select 3–5 food items for each set
            $selectedFoods = $foods->random(rand(3, 5));
            $foodIds = $selectedFoods->pluck('id')->toArray();

            // calculate total cost of selected items
            $calcCost = $selectedFoods->sum('price');

            // apply random discount between 10–20%
            $discount = rand(10, 20) / 100;
            $finalCost = round($calcCost * (1 - $discount), 2);

            // create set menu
            $set = SetMenu::create([
                'branch_id'       => $branchId,
                'category_id'     => $categoryId,
                'title'           => 'Set Menu ' . $i,
                'japanese_title'  => 'セット ' . $i,
                'foods_item'      => $foodIds,
                'calculated_cost' => $calcCost,
                'cost'            => $finalCost,
                'description'     => 'Special Japanese set menu ' . $i . ' with ' . count($foodIds) . ' dishes.',
                'images'          => ["setmenus/set_$i.jpg"],
                'created_by'      => $userId,
            ]);

            // attach relation
            $set->foods()->attach($foodIds);
        }
    }
}
