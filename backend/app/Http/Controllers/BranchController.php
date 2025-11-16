<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $query = Branch::query();

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%")
                ->orWhere('japanese_name', 'like', "%{$request->search}%")
                ->orWhere('location', 'like', "%{$request->search}%");
        }

        return $query->with('creator')->latest()->paginate(5); // pagination 5 per page
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'japanese_name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'image' => 'nullable|image|max:2048'
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('branches', 'public');
        }

        $data['created_by'] = Auth::id();

        $branch = Branch::create($data);

        return response()->json($branch->load('creator'));
    }

    public function show(Branch $branch)
    {
        return response()->json($branch->load('creator'));
    }

    public function update(Request $request, Branch $branch)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'japanese_name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'image' => 'nullable|image|max:2048'
        ]);

        if ($request->hasFile('image')) {
            // Delete old image
            if ($branch->image) Storage::disk('public')->delete($branch->image);
            $data['image'] = $request->file('image')->store('branches', 'public');
        }

        $branch->update($data);

        return response()->json($branch->load('creator'));
    }

    public function destroy(Branch $branch)
    {
        if ($branch->image) Storage::disk('public')->delete($branch->image);
        $branch->delete();
        return response()->json(['message' => 'Branch deleted']);
    }
}
