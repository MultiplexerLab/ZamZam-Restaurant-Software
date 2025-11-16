<?php
namespace App\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\OrderItemResource;

class OrderResource extends JsonResource
{
     public function toArray($req)
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'status' => $this->status,
            'total' => (float) $this->total,
            'discount' => (float) ($this->discount ?? 0), // include discount
            'payment_method' => $this->payment_method,    // include payment method
            'card_number' => $this->card_number,          // include last 4 digits
            'meta' => $this->meta,
            'items' => OrderItemResource::collection($this->items),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'table_number' => $this->table_number ?? '',
        ];
    }
}
