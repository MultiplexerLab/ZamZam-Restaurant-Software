<?php

namespace App\Http\Controllers;

use App\Models\Food;
use App\Models\SetMenuV1;
use App\Models\SetMenuSlot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class SetMenuControllerV1 extends Controller
{
    // List all set menus
    public function index()
    {
        $menus = SetMenuV1::with('branch', 'slots.defaultFood')->get();

        return $menus->map(function($menu) {
            $slots = $menu->slots
                ->where('type', '!=', 'other') // only main slots
                ->map(function($slot) use ($menu) {
                    // collect additional foods for this slot
                    $additionalFoods = $menu->slots
                        ->where('type', 'other')
                        ->where('category_id', $slot->category_id)
                        ->map(fn($f) => [
                            'food_id' => $f->default_food_id,
                            'name' => $f->defaultFood?->name,
                            'additional_price' => $f->additional_price,
                            'default_food' => $f->defaultFood, // full object for frontend
                        ])->values();

                    return [
                        'id' => $slot->id,
                        'category_id' => $slot->category_id,
                        'type' => $slot->type,
                        'default_food_id' => $slot->default_food_id,
                        'quantity' => $slot->quantity,
                        'additional_price' => $slot->additional_price,
                        'default_food' => $slot->defaultFood,
                        'additional_foods' => $additionalFoods, // <--- here is the fix
                    ];
                });

            $menu->slots = $slots;
            return $menu;
        });
    }

    public function store(Request $request)
    {
        $fid = Food::first()->id;

        $data = $request->validate([
            'branch_id'        => 'required|exists:branches,id',
            'title'            => 'required|string|max:255',
            'japanese_title'   => 'nullable|string|max:255',
            'meal_type'        => 'nullable|string|max:100',
            'description'      => 'nullable|string',
            'jp_description'   => 'nullable|string',
            'is_available'     => 'nullable|string',
            'is_takeout_menu'     => 'nullable|string',
            'base_price'       => 'required|numeric|min:0',
            'images'           => 'nullable|array',
            'images.*'         => 'image', // max 50MB per image
            'slots'            => 'nullable',
            'slots.*.category_id' => 'required|exists:categories,id',
            'slots.*.type'        => 'required|string|in:changeable,choosable',
            'slots.*.default_food_id' => 'nullable|exists:foods,id',
            'slots.*.quantity'      => 'required|integer|min:1',
            'slots.*.additional_price' => 'nullable|numeric|min:0',
            'slots.*.other_foods'      => 'nullable|array',
            'slots.*.other_foods.*.food_id' => 'required|exists:foods,id',
            'slots.*.other_foods.*.additional_price' => 'required|numeric|min:0',
        ]);

        // Handle image uploads
        if ($request->hasFile('images')) {
            $data['images'] = [];
            foreach ($request->file('images') as $image) {
                $data['images'][] = $image->store('set_menus', 'public');
            }
        }

        $data['created_by'] = auth()->id();

        // Create the Set Menu
        $setMenu = SetMenuV1::create($data);

        // Save Slots
        if (!empty($request->slots)) {
            $slots = is_string($request->slots) ? json_decode($request->slots, true) : $request->slots;

            $mainSlot = null;

            foreach ($slots as $slot) {
                // Save main/default food slot

                if ($slot['type'] == 'choosable') {
                    $fid = Food::where('category_id', $slot['category_id'])->first()?->id;
                }

                $spiceLabel = null;

                if ($slot['category_id'] == '11') {
                    $spiceLabel = 'mild';
                }

                $mainSlot = $setMenu->slots()->create([
                    'category_id'      => $slot['category_id'],
                    'type'             => $slot['type'],
                    'default_food_id'  => !empty($slot['default_food_id']) ? $slot['default_food_id'] : $fid,
                    'quantity'         => $slot['quantity'],
                    'additional_price' => $slot['additional_price'] ?? 0,
                    'spice_level' => $spiceLabel,
                ]);

                // Save other foods with additional price
                if (!empty($slot['other_foods'])) {
                    foreach ($slot['other_foods'] as $otherFood) {
                        $setMenu->slots()->create([
                            'category_id'      => $slot['category_id'],
                            'type'             => 'other', // special type for additional foods
                            'default_food_id'  => $otherFood['food_id'],
                            'quantity'         => 1,
                            'additional_price' => $otherFood['additional_price'],
                            'spice_level' => $spiceLabel,
                        ]);
                    }
                }
            }
        }

        return response()->json($setMenu->load('slots'), 201);
    }

    // Show a single set menu
    public function show(SetMenuV1 $setMenu)
    {
        return $setMenu->load('slots.category', 'slots.defaultFood');
    }

    // Update a set menu
    // Update a set menu
    public function update(Request $request, SetMenuV1 $setMenu)
    {
        $validated = $request->validate([
            'title'                 => 'sometimes|required|string|max:255',
            'japanese_title'        => 'nullable|string|max:255',
            'meal_type'             => 'nullable|string|max:100',
            'description'           => 'nullable|string',
            'jp_description'        => 'nullable|string',
            'base_price'            => 'sometimes|required|numeric|min:0',
            'is_available'          => 'boolean',
            'is_takeout_menu'       => 'nullable|string',

            // images
            'old_images'            => 'nullable|array',
            'old_images.*'          => 'string',
            'images'                => 'nullable|array',
            'images.*'              => 'image',

            // slots
            'slots'                                 => 'nullable',
            'slots.*.category_id'                   => 'required|exists:categories,id',
            'slots.*.type'                          => 'required|string|in:changeable,choosable',
            'slots.*.default_food_id'               => 'nullable|exists:foods,id',
            'slots.*.quantity'                      => 'required|integer|min:1',
            'slots.*.additional_price'              => 'nullable|numeric|min:0',
            'slots.*.other_foods'                   => 'nullable|array',
            'slots.*.other_foods.*.food_id'         => 'required|exists:foods,id',
            'slots.*.other_foods.*.additional_price'=> 'required|numeric|min:0',
        ]);

        /* -------------------------------------------------------
         *  IMAGE HANDLING (FULL FIX)
         * -----------------------------------------------------*/

        // Start with old images kept by frontend
        $finalImages = $request->old_images ?? [];

        // Determine which old images were deleted
        $deletedImages = array_diff($setMenu->images ?? [], $finalImages);

        // Physically delete removed images
        foreach ($deletedImages as $img) {
            Storage::disk('public')->delete($img);
        }

        // Append newly uploaded images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $finalImages[] = $image->store('set_menus', 'public');
            }
        }

        $validated['images'] = $finalImages;

        /* -------------------------------------------------------
         *  UPDATE MAIN SET MENU DATA
         * -----------------------------------------------------*/
        $setMenu->update($validated);

        /* -------------------------------------------------------
         *  UPDATE SLOTS
         * -----------------------------------------------------*/
        if (!empty($request->slots)) {

            $slots = is_string($request->slots)
                ? json_decode($request->slots, true)
                : $request->slots;

            // Delete all existing slots
            $setMenu->slots()->delete();

            foreach ($slots as $slot) {

                // Auto fallback food ID if needed
                if ($slot['type'] === 'choosable' && empty($slot['default_food_id'])) {
                    $slot['default_food_id'] = Food::where('category_id', $slot['category_id'])->value('id');
                }

                // Spice logic
                $spiceLabel = $slot['category_id'] == '11' ? 'mild' : null;

                // Save main slot
                $newSlot = $setMenu->slots()->create([
                    'category_id'      => $slot['category_id'],
                    'type'             => $slot['type'],
                    'default_food_id'  => $slot['default_food_id'],
                    'quantity'         => $slot['quantity'],
                    'additional_price' => $slot['additional_price'] ?? 0,
                    'spice_level'      => $spiceLabel,
                ]);

                // Save other foods
                if (!empty($slot['other_foods'])) {
                    foreach ($slot['other_foods'] as $food) {
                        $setMenu->slots()->create([
                            'category_id'      => $slot['category_id'],
                            'type'             => 'other',
                            'default_food_id'  => $food['food_id'],
                            'quantity'         => 1,
                            'additional_price' => $food['additional_price'],
                            'spice_level'      => $spiceLabel,
                        ]);
                    }
                }
            }
        }

        return response()->json(
            $setMenu->load('slots.category', 'slots.defaultFood')
        );
    }



    // Delete a set menu
    public function destroy(SetMenuV1 $setMenu)
    {
        $setMenu->delete();
        return response()->json(['message' => 'Set Menu deleted']);
    }

    // Add slot to a set menu
    public function addSlot(Request $request, SetMenuV1 $setMenu)
    {
        $data = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'type' => 'required|in:changeable,choosable',
            'default_food_id' => 'nullable|exists:foods,id',
            'quantity' => 'required|integer|min:1',
            'additional_price' => 'nullable|numeric|min:0',
        ]);

        $slot = $setMenu->slots()->create($data);

        return response()->json($slot->load('category', 'defaultFood'), 201);
    }

    // Update a slot
    public function updateSlot(Request $request, SetMenuV1 $setMenu, SetMenuSlot $slot)
    {
        $data = $request->validate([
            'category_id' => 'sometimes|required|exists:categories,id',
            'type' => 'sometimes|required|in:changeable,choosable',
            'default_food_id' => 'nullable|exists:foods,id',
            'quantity' => 'sometimes|required|integer|min:1',
            'additional_price' => 'nullable|numeric|min:0',
        ]);

        $slot->update($data);

        return response()->json($slot->load('category', 'defaultFood'));
    }

    // Delete a slot
    public function deleteSlot(SetMenuV1 $setMenu, SetMenuSlot $slot)
    {
        $slot->delete();
        return response()->json(['message' => 'Slot deleted']);
    }
}
