<?php

namespace App\Http\Controllers;

use App\Models\Food;
use App\Models\FoodExchangeItem;
use Illuminate\Http\Request;

class FoodExchangeItemController extends Controller
{
    // In FoodExchangeItemController.php
    public function index(Request $request)
    {
        $exchangeFoods = FoodExchangeItem::where('food_id', $request->food_id)
            ->where('set_menu_id', $request->setmenu_id)
            ->with(['exchangeFood']) // optional relation to get food name
            ->get();

        return response()->json($exchangeFoods);
    }
    /**
     * Store a new exchange food item
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'set_menu_id' => 'required|exists:set_menus,id',
            'food_id' => 'required|exists:foods,id',
            'exchange_food_id' => 'required|exists:foods,id',
            'additional_price' => 'nullable|numeric',
        ]);

        $validated['additional_price'] = $validated['additional_price'] ?? 0;

        // Check if this combination already exists
        $item = \App\Models\FoodExchangeItem::where('set_menu_id', $validated['set_menu_id'])
            ->where('food_id', $validated['food_id'])
            ->where('exchange_food_id', $validated['exchange_food_id'])
            ->first();

        if ($item) {
            // Update price if exists
            $item->update(['additional_price' => $validated['additional_price']]);
            $message = 'Exchange item updated successfully';
        } else {
            // Create new
            $item = \App\Models\FoodExchangeItem::create($validated);
            $message = 'Exchange item created successfully';
        }

        return response()->json([
            'message' => $message,
            'data' => $item
        ], 201);
    }

    /**
     * Show a single item by menu_id + food_id
     */
    public function show($menu_id, $food_id)
    {
        $item = FoodExchangeItem::where('set_menu_id', $menu_id)
            ->where('food_id', $food_id)
            ->first();

        if (!$item) {
            return response()->json(['message' => 'Item not found'], 404);
        }

        return response()->json($item);
    }

    /**
     * Update item by menu_id + food_id
     */
    public function update(Request $request, $menu_id, $food_id)
    {
        $item = FoodExchangeItem::where('set_menu_id', $menu_id)
            ->where('food_id', $food_id)
            ->first();

        if (!$item) {
            return response()->json(['message' => 'Item not found'], 404);
        }

        $validated = $request->validate([
            'exchange_food_id' => 'required|integer',
            'additional_price' => 'nullable|numeric|min:0',
        ]);

        $item->update([
            'exchange_food_id' => $validated['exchange_food_id'],
            'additional_price' => $validated['additional_price'] ?? 0,
        ]);

        return response()->json([
            'message' => 'Food exchange item updated successfully',
            'data' => $item,
        ]);
    }

    // ... your store & index methods

    /**
     * Delete a food exchange item
     */
    public function destroy($id)
    {
        $item = FoodExchangeItem::find($id);

        if (!$item) {
            return response()->json([
                'message' => 'Exchange item not found'
            ], 404);
        }

        $item->delete();

        return response()->json([
            'message' => 'Exchange item deleted successfully'
        ]);
    }
}
