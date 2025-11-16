<?php

namespace App\Http\Controllers;

use App\Models\SetMenu;
use App\Models\Food;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SetMenuController extends Controller
{
    public function index(Request $request)
    {
        $query = SetMenu::with(['creator', 'branch', 'category'])->orderBy('id', 'desc');

        if (! empty($category)) {
            $query->where('category_id', $category);
        }

        if ($search = $request->input('search')) {
            $query->where('title', 'like', "%$search%")
                ->orWhere('japanese_title', 'like', "%$search%");
        }

        return $query->paginate(10);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'branch_id' => 'required|exists:branches,id',
            'category_id' => 'required|exists:categories,id',
            'meal_type' => 'required',
            'japanese_title' => 'nullable|string|max:255',
            'foods_item' => 'required|array',
            'foods_item.*' => 'exists:foods,id',
            'cost' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'images.*' => 'nullable|image|max:2048',
            'is_available' => 'required|boolean'
        ]);

        // calculate cost from selected foods
        $calculatedCost = Food::whereIn('id', $validated['foods_item'])->sum('price');

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $img) {
                $imagePaths[] = $img->store('setmenus', 'public');
            }
        }

        $menu = SetMenu::create([
            'title' => $validated['title'],
            'japanese_title' => $validated['japanese_title'] ?? null,
            'branch_id' => $validated['branch_id'],
            'meal_type' => $validated['meal_type'],
            'category_id' => $validated['category_id'],
            'foods_item' => $validated['foods_item'],
            'calculated_cost' => $calculatedCost,
            'cost' => $validated['cost'],
            'description' => $validated['description'] ?? null,
            'images' => $imagePaths,
            'created_by' => auth()->id(),
            'is_available' => $validated['is_available'] ?? 0,
        ]);

        return response()->json($menu->load('creator'), 201);
    }

    public function show($setMenu)
    {
        $menu = SetMenu::find($setMenu);
        return $menu->load(['creator', 'branch', 'category', 'foods']);
    }

    public function update(Request $request, $setMenuId)
    {
        $menu = SetMenu::findOrFail($setMenuId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'branch_id' => 'required|exists:branches,id',
            'category_id' => 'required|exists:categories,id',
            'meal_type' => 'required',
            'japanese_title' => 'nullable|string|max:255',
            'foods_item' => 'required|array',
            'foods_item.*' => 'exists:foods,id',
            'cost' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'images.*' => 'nullable|image|max:2048',
            'is_available' => 'required|boolean',
        ]);

        $calculatedCost = Food::whereIn('id', $validated['foods_item'])->sum('price');

        $imagePaths = $menu->images ?? [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $img) {
                $imagePaths[] = $img->store('setmenus', 'public');
            }
        }

        $menu->update([
            'title' => $validated['title'],
            'branch_id' => $validated['branch_id'],
            'category_id' => $validated['category_id'],
            'meal_type' => $validated['meal_type'],
            'japanese_title' => $validated['japanese_title'] ?? null,
            'foods_item' => $validated['foods_item'],
            'calculated_cost' => $calculatedCost,
            'cost' => $validated['cost'],
            'description' => $validated['description'] ?? null,
            'images' => $imagePaths,
            'is_available' => $validated['is_available'] ?? 0,
        ]);

        return response()->json($menu->load('creator'));
    }

    public function destroy(SetMenu $setMenu)
    {
        if ($setMenu->images) {
            foreach ($setMenu->images as $img) {
                Storage::disk('public')->delete($img);
            }
        }
        $setMenu->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
