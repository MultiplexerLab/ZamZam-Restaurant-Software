<?php

namespace App\Http\Controllers;

use App\Models\Food;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FoodController extends Controller
{
    public function index(Request $request)
    {
        $query = Food::with(['branch', 'category', 'creator'])
            ->orderBy('created_at', 'desc');

        if ($category = $request->query('category_id')) {
            $query->where('category_id', $category);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('japanese_name', 'like', "%{$search}%");
            });
        }

        // ✅ Filter by availability (true/false)
        if (!is_null($request->query('is_available'))) {
            $query->where('is_available', (bool) $request->query('is_available', 1));
        }

        // ✅ Filter by takeout menu (true/false)
        if (!is_null($request->query('is_takeout_menu'))) {
            if ($request->query('is_takeout_menu') == "1") {
                $query->where('is_takeout_menu', 1);
            } elseif ($request->query('is_takeout_menu') == "0") {
                $query->whereNot('is_takeout_menu', "1");
            }
        }

        return $query->paginate(200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'category_id' => 'required|exists:categories,id',
            'meal_type' => 'required',
            'name' => 'required|string|max:255',
            'japanese_name' => 'nullable|string|max:255',
            'price' => 'required|numeric',
            'description' => 'nullable|string',
            'jp_description' => 'nullable|string',
            'images.*' => 'nullable|image',
            'set_menu_image' => 'nullable|image',
            'is_available' => 'required',
            'spice_level' => 'nullable|string',
            'is_takeout_menu' => 'nullable|string',
        ]);

        // Store uploaded images
        $images = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $images[] = $file->store('foods', 'public');
            }
        }

        $validated['images'] = $images;

        // ✅ Handle set menu image
        if ($request->hasFile('set_menu_image')) {
            $validated['set_menu_image'] = $request->file('set_menu_image')->store('foods/set_menus', 'public');
        }

        $validated['created_by'] = 1;

        $food = Food::create($validated);

        return response()->json($food->load(['branch', 'category', 'creator']), 201);
    }

    public function show(Food $food)
    {
        return $food->load(['branch', 'category', 'creator']);
    }

    public function update(Request $request, Food $food)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'meal_type' => 'required',
            'japanese_name' => 'nullable|string|max:255',
            'price' => 'required|numeric',
            'description' => 'nullable|string',
            'jp_description' => 'nullable|string',
            'is_available' => 'required',
            'images.*' => 'nullable|image',
            'old_images' => 'nullable|array',
            'spice_level' => 'nullable|string',
            'set_menu_image' => 'nullable|image',        // ✅ new field
            'old_set_menu_image' => 'nullable|string',   // ✅ old image name
            'is_takeout_menu' => 'nullable|string',
        ]);

        $currentImages = $food->images ?? [];

        // Remove deleted old images
        $oldImagesToKeep = $request->input('old_images', []);
        $imagesToDelete = array_diff($currentImages, $oldImagesToKeep);
        foreach ($imagesToDelete as $img) {
            Storage::disk('public')->delete($img);
        }

        // Upload new images
        $newImages = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $newImages[] = $file->store('foods', 'public');
            }
        }

        // Merge old kept images with new uploaded images
        $validated['images'] = array_merge($oldImagesToKeep, $newImages);

        // ✅ Handle set menu image update
        if ($request->hasFile('set_menu_image')) {
            // Delete old one if exists
            if ($food->set_menu_image && Storage::disk('public')->exists($food->set_menu_image)) {
                Storage::disk('public')->delete($food->set_menu_image);
            }
            $validated['set_menu_image'] = $request->file('set_menu_image')->store('foods/set_menus', 'public');
        } elseif ($request->filled('old_set_menu_image')) {
            // Keep the old one if not replaced
            $validated['set_menu_image'] = $request->input('old_set_menu_image');
        } else {
            // Remove it if user deleted it
            if ($food->set_menu_image && Storage::disk('public')->exists($food->set_menu_image)) {
                Storage::disk('public')->delete($food->set_menu_image);
            }
            $validated['set_menu_image'] = null;
        }

        $food->update($validated);

        return response()->json($food->load(['branch', 'category', 'creator']));
    }

    public function destroy(Food $food)
    {
        if ($food->images) {
            foreach ($food->images as $img) {
                Storage::disk('public')->delete($img);
            }
        }

        // ✅ Delete set_menu_image as well
        if ($food->set_menu_image) {
            Storage::disk('public')->delete($food->set_menu_image);
        }

        $food->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    public function getSimilarCategoryFoods($foodId)
    {
        $food = Food::findOrFail($foodId);

        $similarFoods = Food::where('category_id', $food->category_id)
            ->where('id', '!=', $foodId)
            ->select('id', 'name')
            ->get();

        return response()->json([
            'food_id' => $foodId,
            'category_id' => $food->category_id,
            'similar_foods' => $similarFoods,
        ]);
    }

    public function getByCategory(Request $request, Category $category)
    {
        $query = $category->foods()->where('is_available', true);

        if (!is_null($request->query('is_takeout_menu'))) {
            $query->where('is_takeout_menu', (bool) $request->query('is_takeout_menu'));
        }

        return response()->json($query->get());
    }
}
