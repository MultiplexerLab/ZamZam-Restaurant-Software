<?php

namespace App\Http\Controllers;

use App\Models\CartSlot;
use App\Models\SetMenuSlot;
use App\Models\SetMenuV1;
use Illuminate\Http\Request;
use App\Models\Cart;
use App\Http\Resources\CartResource;
use Illuminate\Support\Facades\Auth;
use App\Models\Food;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $items = Cart::with([
            'food',
            'set_menu',
            'slots.food',
            'slots.slot.category' // optional if you want slot_name = category name
        ])->where('user_id', $user->id)->get();

        Log::channel('single')->info('message', $items->toArray());
        return CartResource::collection($items);
    }

    public function add(Request $request)
    {
        $user = auth()->user();

        $type = null;
        $price = 0;

        // 🔸 Determine type and base price
        if ($request->food_id) {
            $food = Food::find($request->food_id);
            $price = $food ? $food->price : 0;
            $type = 'food';
        } elseif ($request->set_menu_id) {
            $menu = SetMenuV1::with('slots')->find($request->set_menu_id);
            if (!$menu) {
                return response()->json(['error' => 'Set menu not found'], 404);
            }
            $price = $menu->base_price;
            $type = 'set_menu';
        } else {
            return response()->json(['error' => 'Invalid item'], 400);
        }

        // 🔸 Check if a cart entry already exists for this exact item
        $cart = Cart::where('user_id', $user->id)
            ->where('food_id', $request->food_id)
            ->where('set_menu_id', $request->set_menu_id)
            ->first();

        if ($cart) {
            // Increment quantity if already in cart
            $cart->quantity += $request->quantity ?? 1;
            $cart->save();
        } else {
            // Create new cart record
            $cart = Cart::create([
                'user_id'     => $user->id,
                'food_id'     => $request->food_id,
                'set_menu_id' => $request->set_menu_id,
                'quantity'    => $request->quantity ?? 1,
                'price'       => $price,
                'type'        => $type,
                'spice_level' => $request->spice_level ?? '',
            ]);
        }

        // 🔸 Handle set menu slots + price adjustments
        if ($type === 'set_menu' && $request->slots && is_array($request->slots)) {
            foreach ($request->slots as $slotData) {
                Log::channel('single')->info('message', $slotData);
                $slotId = $slotData['slot_id'] ?? null;

                if (!$slotId) continue;

                $slot = $menu->slots->where('id', $slotId)->first();
                if (!$slot) continue;

                // 🟠 Case 1: single chosen food (fixed/changeable)
                if (isset($slotData['chosen_food_id'])) {
                    $chosenFoodId = $slotData['chosen_food_id'];

                    // If changeable, and chosen food ≠ default, add extra price
                    if ($slot->type === 'changeable' && $slot->default_food_id != $chosenFoodId) {
                        $chosenfFood = SetMenuSlot::query()->where(
                            [
                                'default_food_id' =>$chosenFoodId,
                                'set_menu_id' => $menu->id,
                                'category_id' => $slot->category_id,
                            ])->first() ?? null;

                        $price += $chosenfFood->additional_price ?? 0;
                    }

                    CartSlot::create([
                        'cart_id' => $cart->id,
                        'slot_id' => $slotId,
                        'food_id' => $chosenFoodId,
                        'spice_level' =>  $slotData['spice_level'] ?? '',
                    ]);
                }

                // 🟢 Case 2: multiple chosen foods (choosable)
                if (isset($slotData['chosen_food_ids']) && is_array($slotData['chosen_food_ids'])) {
                    foreach ($slotData['chosen_food_ids'] as $foodData) {
                        CartSlot::create([
                            'cart_id' => $cart->id,
                            'slot_id' => $slotId,
                            'food_id' => $foodData['food_id'] ?? null,
                            'spice_level' => $foodData['spice_level'] ?? '',
                        ]);
                    }
                }
            }

            // 🔸 Update price after calculating slot adjustments
            $cart->price = $price;
            $cart->save();
        }

        return response()->json(
            $cart->load('food', 'set_menu', 'slots.food', 'slots.slot')
        );
    }


    public function update(Request $request, $id)
    {
        $request->validate(['quantity'=>'required|integer|min:1']);
        $user = Auth::user();
        $cart = Cart::where('user_id',$user->id)->where('id',$id)->firstOrFail();
        $cart->quantity = $request->quantity;
        $cart->save();
        return new CartResource($cart->load(['food','set_menu']));
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $cart = Cart::where('user_id',$user->id)->where('id',$id)->firstOrFail();
        $cart->delete();
        return response()->json(['message'=>'deleted']);
    }
}
