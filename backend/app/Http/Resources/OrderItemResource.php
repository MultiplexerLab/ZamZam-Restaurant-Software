<?php
namespace App\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray($req)
    {
        return [
            'id'=>$this->id,
            'food_id'=>$this->food_id,
            'set_menu_id'=>$this->set_menu_id,
            'title'=>$this->name,
            'japanese_name'=>$this->japanese_name,
            'price'=> (float)$this->price,
            'quantity'=>$this->quantity,
            'meta'=>$this->meta,
            'spice_level'=>$this->spice_level
        ];
    }
}
