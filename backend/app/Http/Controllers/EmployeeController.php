<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class EmployeeController extends Controller
{
    // Server-side list with search, sort, pagination
    public function index(Request $request)
    {
        $query = Employee::with(['branch', 'user']);

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search){
                $q->where('first_name','like',"%$search%")
                    ->orWhere('last_name','like',"%$search%")
                    ->orWhere('designation','like',"%$search%")
                    ->orWhereHas('user', function($q2) use ($search) {
                        $q2->where('email','like',"%$search%");
                    });
            });
        }

        $sortField = $request->sort_field ?? 'id';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortField, $sortOrder);

        $perPage = $request->per_page ?? 5;

        $employees = $query->paginate($perPage);

        return response()->json($employees);
    }

    // Create Employee + User
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'branch_id' => 'required|exists:branches,id',
            'image' => 'required|image|max:2048',
            'joining_date' => 'required|date',
        ]);

        if ($validator->fails()) return response()->json($validator->errors(), 422);

        // Create User
        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'name' => 'sazzad'
        ]);

        // Create Employee
        $data = $request->all();
        $data['user_id'] = $user->id;

        if($request->hasFile('image')){
            $data['image'] = $request->file('image')->store('employees','public');
        }

        $employee = Employee::create($data);

        return response()->json($employee,201);
    }

    public function show($id)
    {
        $employee = Employee::with(['branch','user'])->findOrFail($id);
        return response()->json($employee);
    }

    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
        $user = $employee->user;

        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email,'.$user->id,
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'branch_id' => 'required|exists:branches,id',
            'image' => 'sometimes|image|max:2048',
            'joining_date' => 'required|date',
        ]);

        if ($validator->fails()) return response()->json($validator->errors(), 422);

        $user->update(['email' => $request->email]);

        $data = $request->all();
        if($request->hasFile('image')){
            if($employee->image){
                Storage::disk('public')->delete($employee->image);
            }
            $data['image'] = $request->file('image')->store('employees','public');
        }

        $employee->update($data);

        return response()->json($employee);
    }

    public function destroy($id)
    {
        $employee = Employee::findOrFail($id);
        if($employee->image){
            Storage::disk('public')->delete($employee->image);
        }
        $employee->delete(); // user will also be deleted if cascade is set
        return response()->json(['message'=>'Deleted successfully']);
    }
}
