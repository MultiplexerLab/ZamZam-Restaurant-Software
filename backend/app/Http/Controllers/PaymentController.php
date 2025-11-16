<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function payTable(Request $request)
    {
        Log::channel('single')->info('exiwt');
        $request->validate([
            'table_number' => 'required|integer',
            'payment_method' => 'required|in:cash,card',
            'card_number' => 'nullable|string',
            'discount' => 'nullable|numeric',
            'total' => 'nullable|numeric',
        ]);

        $tableNumber = $request->table_number;
        $discount = $request->discount ?? 0;

        $orders = Order::with('items')->where('table_number', $tableNumber)
             ->whereNot('status', 'paid')
            ->get();

        if ($orders->isEmpty()) {
            return response()->json(['message' => 'No pending orders for this table'], 400);
        }

        $totalAmount = $orders->sum('total');
        $paidAmount = $totalAmount - $discount;

        DB::beginTransaction();
        try {
            // Store payment
            $payment = Payment::create([
                'table_number' => $tableNumber,
                'total_amount' => $request->total + $discount,
                'discount' => $discount,
                'paid_amount' =>  $request->total,
                'payment_method' => $request->payment_method,
                'card_number' => $request->payment_method === 'card' ? $request->card_number : null,
                'orders' => $orders->toArray(),
            ]);

            // Update order status
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

    public function paymentHistory(Request $request)
    {
        $query = Payment::query();

        // Optional date filters
        if ($request->has('from_date') && $request->has('to_date')) {
            $query->whereBetween('created_at', [$request->from_date, $request->to_date]);
        }

        // You can also filter by table number if needed
        if ($request->has('table_number')) {
            $query->where('table_number', $request->table_number);
        }

        $payments = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'payments' => $payments,
        ]);
    }
}
