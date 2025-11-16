<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Models\SetMenuSlot;

class CartResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'         => $this->id,
            'quantity'   => $this->quantity,
            'type'       => $this->type,
            'price'      => (float) $this->price,
            'spice_level'=> $this->spice_level, // 🌶️ spice level for single food or set menu root
            'created_at' => $this->created_at,

            // 🥢 Normal food item
            'food' => $this->when($this->food, function () {
                return [
                    'id'             => $this->food->id,
                    'name'           => $this->food->name,
                    'japanese_name'  => $this->food->japanese_name,
                    'price'          => (float) $this->food->price,
                    'image'          => $this->food->image,
                    'spice_level'    => $this->spice_level, // 🌶️ include spice level for normal foods
                ];
            }),

            // 🍱 Set menu
            'set_menu' => $this->when($this->set_menu, function () {
                return [
                    'id'             => $this->set_menu->id,
                    'title'          => $this->set_menu->title,
                    'japanese_title' => $this->set_menu->japanese_title,
                    'base_price'     => (float) $this->set_menu->base_price,
                    'images'         => $this->set_menu->images,
                    'spice_level'    => $this->spice_level, // 🌶️ include spice level at set_menu level
                ];
            }),

            // 🧠 Slots with chosen foods + additional costs
            'slots' => $this->when($this->type === 'set_menu', function () {
                return $this->slots
                    ->groupBy('slot_id')
                    ->map(function ($group) {
                        $slot = $group->first()->slot;

                        return [
                            'slot_id'   => $slot?->id,
                            'slot_name' => $slot?->category?->name ?? $slot?->id,
                            'slot_type' => $slot?->type,

                            'chosen_foods' => $group->map(function ($cartSlot) use ($slot) {
                                $food = $cartSlot->food;

                                // 🔸 Calculate additional cost if slot is "changeable" and food != default
                                $additionalCost = 0;
                                if ($slot && $slot->type === 'changeable' && $slot->default_food_id != $food->id) {
                                    $matched = SetMenuSlot::query()
                                        ->where([
                                            'default_food_id' => $food->id,
                                            'set_menu_id'     => $slot->set_menu_id,
                                            'category_id'     => $slot->category_id,
                                        ])->first();

                                    $additionalCost = $matched?->additional_price ?? $slot->additional_price ?? 0;
                                }

                                return [
                                    'id'               => $food->id,
                                    'name'             => $food->name,
                                    'japanese_name'    => $food->japanese_name,
                                    'price'            => (float) $food->price,
                                    'image'            => $food->image,
                                    'additional_cost'  => (float) $additionalCost,
                                    'spice_level'      => $cartSlot->spice_level, // 🌶️ per-slot spice level
                                ];
                            })->values()
                        ];
                    })->values();
            }),
        ];
    }
}
