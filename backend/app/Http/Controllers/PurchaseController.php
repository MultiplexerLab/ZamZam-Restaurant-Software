<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $query = Purchase::with('creator')->orderBy('date', 'desc');

        if ($search = $request->input('search')) {
            $query->where('title', 'like', "%$search%")
                ->orWhere('description', 'like', "%$search%");
        }

        return $query->paginate(10);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'title' => 'required|string|max:255',
            'cost' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'images.*' => 'nullable|image|max:2048',
        ]);

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $img) {
                $imagePaths[] = $img->store('purchases', 'public');
            }
        }

        $purchase = Purchase::create([
            'date' => $validated['date'],
            'title' => $validated['title'],
            'cost' => $validated['cost'],   // ✅ save cost
            'description' => $validated['description'] ?? null,
            'images' => $imagePaths,
            'created_by' => auth()->id(),
        ]);

        return response()->json($purchase->load('creator'), 201);
    }

    public function show(Purchase $purchase)
    {
        return $purchase->load('creator');
    }

    public function update(Request $request, Purchase $purchase)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'images.*' => 'nullable|image|max:2048',
        ]);

        $imagePaths = $purchase->images ?? [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $img) {
                $imagePaths[] = $img->store('purchases', 'public');
            }
        }

        $purchase->update([
            'date' => $validated['date'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'images' => $imagePaths,
        ]);

        return response()->json($purchase->load('creator'));
    }

    public function destroy(Purchase $purchase)
    {
        if ($purchase->images) {
            foreach ($purchase->images as $img) {
                Storage::disk('public')->delete($img);
            }
        }

        $purchase->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}

