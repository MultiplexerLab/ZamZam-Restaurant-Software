<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Http\Resources\OrderResource;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:pending,preparing,completed',
        ]);

        $order = Order::find($id);

        if (!$order) {
            return response()->json([
                'message' => 'Order not found.'
            ], 404);
        }

        $order->status = $request->status;
        $order->save();

        return response()->json([
            'message' => 'Order status updated successfully.',
            'data' => $order
        ]);
    }

    /**
     * Create a new order from the user's cart
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Load cart with food, set_menu, and cart slots
        $carts = Cart::with(['food', 'set_menu', 'slots.food', 'slots.slot'])->where('user_id', $user->id)->get();

        if ($carts->isEmpty()) {
            return response()->json(['message' => 'Cart is empty'], 422);
        }

        DB::beginTransaction();

        try {
            // Create order
            $order = Order::create([
                'user_id' => $user->id,
                'status' => 'pending',
                'total' => 0,
                'table_number' => $user->table,
                'meta' => $request->meta ?? null,
            ]);

            $total = 0;

            foreach ($carts as $cart) {
                if ($cart->food) {
                    // Regular food
                    $price = $cart->price;
                    $total += $price * $cart->quantity;

                    OrderItem::create([
                        'order_id' => $order->id,
                        'food_id' => $cart->food->id,
                        'name' => $cart->food->name,
                        'japanese_name' => $cart->food->japanese_name,
                        'price' => $price,
                        'quantity' => $cart->quantity,
                        'spice_level' => $cart->spice_level ?? '',
                    ]);

                } elseif ($cart->set_menu) {
                    // Set menu
                    $basePrice = $cart->set_menu->base_price;
                    $setMenuTotal = $basePrice;

                    $subItems = [];

                    // Add selected slots
                    foreach ($cart->slots as $slot) {
                        $food = $slot->food;
                        if (!$food) continue;

                        $subItems[] = [
                            'slot_id' => $slot->slot_id,
                            'slot_name' => $slot->slot->name ?? '',
                            'food_id' => $food->id,
                            'food_name' => $food->name,
                            'japanese_name' => $food->japanese_name,
                            'price' => $food->price,
                            'additional_price' => $slot->additional_price ?? 0,
                            'spice_level' => $slot->spice_level ?? '',
                        ];

                        // Add additional price if any
                        $setMenuTotal += $slot->additional_price ?? 0;
                    }

                    // Multiply by quantity
                    $total += $setMenuTotal * $cart->quantity;

                    // Create order item
                    OrderItem::create([
                        'order_id' => $order->id,
                        'set_menu_id' => $cart->set_menu->id,
                        'name' => $cart->set_menu->title,
                        'japanese_name' => $cart->set_menu->japanese_title,
                        'price' => $cart->price,
                        'quantity' => $cart->quantity,
                        'meta' => ['slots' => $subItems],
                    ]);
                }
            }

            // Update total
            $order->total = $total;
            $order->save();

            // Clear cart
            Cart::where('user_id', $user->id)->delete();

            DB::commit();

            return new OrderResource($order->load('items'));

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Order failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * List orders (with optional status filter)
     */
    public function index(Request $request)
    {
        $query = Order::with('items','user')->orderBy('created_at','desc');

        if ($request->has('status') && ! empty($request->status)) {
            $query->where('status', $request->status);
        }

        return OrderResource::collection($query->paginate(20));
    }

    /**
     * Show a single order
     */
    public function show($id)
    {
        return new OrderResource(Order::with('items','user')->findOrFail($id));
    }

    /**
     * Update order status
     */
    public function update(Request $request, $id)
{
    $order = Order::findOrFail($id);

    // Validate incoming fields
    $request->validate([
        'status' => 'required|string',
        'discount' => 'nullable|numeric|min:0',
        'payment_method' => 'nullable|string|in:cash,card',
        'card_number' => 'nullable|string',
    ]);

    // Update order fields
    $order->status = $request->status;

    // Save discount if provided
    if ($request->has('discount')) {
        $order->discount = $request->discount;
    }

    // Save payment method if provided
    if ($request->has('payment_method')) {
        $order->payment_method = $request->payment_method;

        // Mask card number if payment method is card
        if ($request->payment_method === 'card' && $request->filled('card_number')) {
            $order->card_number = substr($request->card_number, -4); // only last 4 digits
        }
    }

    $order->save();

    return new OrderResource($order->load('items'));
}

    /**
     * Delete an order
     */
    public function destroy($id)
    {
        $order = Order::findOrFail($id);
        $order->delete();

        return response()->json(['message' => 'Order deleted successfully']);
    }

    /**
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function myTableOrders()
    {
        $user = Auth::user();

        $orders = Order::with(['items', 'user'])
            ->where('table_number', $user->table)
            ->whereNot('status', 'paid')
            ->orderBy('created_at', 'desc')
            ->get();

        return OrderResource::collection($orders);
    }

    public function getTableOrders()
    {
        $orders = Order::with(['items', 'user'])
            ->whereNot('status', 'paid')
            ->orderBy('table_number')
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('table_number')
            ->map(function ($tableOrders, $tableNumber) {
                // Calculate total cost based on items
                $tableTotal = $tableOrders->sum(function ($order) {
                    return $order->items->sum(function ($item) {
                        // If set menu, include slots prices
                        if ($item->set_menu_id && $item->meta && isset($item->meta['slots'])) {
                            return ($item->price) * $item->quantity;
                        } else {
                            return $item->price * $item->quantity;
                        }
                    });
                });

                $lastOrder = $tableOrders->first(); // sorted by created_at desc

                return [
                    'table_number' => $tableNumber,
                    'order_count' => $tableOrders->count(),
                    'orders' => $tableOrders->values(),
                    'total_cost' => $tableTotal,
                    'last_order_at' => $lastOrder->created_at,
                ];
            })
            ->values();

        return response()->json(['data' => $orders]);
    }


    public function payTableOrders(Request $request, $tableNumber)
    {
        $request->validate([
            'payment_method' => 'required|in:cash,card',
        ]);

        // Get all pending orders for the table
        $orders = Order::where('table_number', $tableNumber)
            ->whereNotIn('status', ['completed', 'paid'])
            ->get();

        if ($orders->isEmpty()) {
            return response()->json(['message' => 'No pending orders for this table.'], 404);
        }

        foreach ($orders as $order) {
            $order->status = 'paid';
            $order->payment_method = $request->payment_method;
            $order->save();
        }

        return response()->json([
            'message' => 'All pending orders for table '.$tableNumber.' have been paid.',
            'orders' => $orders
        ]);
    }

    public function payTable(Request $request)
    {
        $request->validate([
            'table_number' => 'required|integer',
            'payment_method' => 'required|in:cash,card',
            'card_number' => 'nullable|string',
            'discount' => 'nullable|numeric',
        ]);

        $tableNumber = $request->table_number;
        $discount = $request->discount ?? 0;

        // Fetch all pending orders for the table
        $orders = Order::where('table_number', $tableNumber)
            ->where('status', 'pending')
            ->get();

        if ($orders->isEmpty()) {
            return response()->json(['message' => 'No pending orders for this table'], 404);
        }

        // Calculate total amount
        $totalAmount = $orders->sum('total');
        $paidAmount = $totalAmount - $discount;

        DB::beginTransaction();
        try {
            // Store in payments table
            $payment = Payment::create([
                'table_number' => $tableNumber,
                'total_amount' => $totalAmount,
                'discount' => $discount,
                'paid_amount' => $paidAmount,
                'payment_method' => $request->payment_method,
                'card_number' => $request->payment_method === 'card' ? $request->card_number : null,
                'orders' => $orders->toArray(),
            ]);

            // Update order status to paid
            Order::whereIn('id', $orders->pluck('id'))->update(['status' => 'paid']);

            DB::commit();

            return response()->json([
                'message' => 'Payment successful',
                'payment' => $payment
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Payment failed', 'error' => $e->getMessage()], 500);
        }
    }

    public function getPendingOrdersByTable($tableNumber)
    {
        // Fetch all non-completed orders for the table
        $orders = Order::with(['items', 'user'])
            ->where('table_number', $tableNumber)
            ->whereNot('status', 'paid')
            ->orderBy('created_at', 'desc')
            ->get();

        if ($orders->isEmpty()) {
            return response()->json([
                'message' => "No pending orders found for table $tableNumber"
            ], 404);
        }

        // Calculate total cost for all pending orders
        $totalCost = $orders->sum(function ($order) {
            return $order->items->sum(function ($item) {
                if ($item->set_menu_id && $item->meta && isset($item->meta['slots'])) {
                    // Optionally include slots prices if needed
                    return $item->price * $item->quantity;
                } else {
                    return $item->price * $item->quantity;
                }
            });
        });

        return response()->json([
            'table_number' => $tableNumber,
            'order_count' => $orders->count(),
            'orders' => $orders,
            'total_cost' => $totalCost,
            'last_order_at' => $orders->first()->created_at, // latest order
        ]);
    }

}
