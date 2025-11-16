<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function index()
    {
        return User::with('profile')->get();
    }

    public function show($id)
    {
        return User::with('profile')->findOrFail($id);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'profiles.first_name' => 'required|string',
            'profiles.last_name' => 'required|string',
            'profiles.employee_number' => 'required|string|unique:profiles',
        ]);

        $user = User::create([
            'name' => 'test',
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $user->profile()->create($data['profile']);

        return $user->load('profile');
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'password' => 'nullable|min:6',
            'profile.first_name' => 'required|string',
            'profile.last_name' => 'required|string',
            'profile.employee_number' => 'required|string|unique:profiles,employee_number,' . $user->profile->id,
        ]);

        if (isset($data['email'])) {
            $user->email = $data['email'];
        }
        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }
        $user->save();

        $user->profile()->update($data['profile']);

        return $user->load('profile');
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'Employee deleted']);
    }
}
