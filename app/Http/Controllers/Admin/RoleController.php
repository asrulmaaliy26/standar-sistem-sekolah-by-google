<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $roles = Role::withCount('users')
            ->paginate(10)
            ->through(fn($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'description' => $role->description,
                'users_count' => $role->users_count,
                'created_at' => $role->created_at->format('Y-m-d H:i'),
            ]);

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/Roles/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name',
            'description' => 'nullable|string',
        ]);

        Role::create($validated);

        return redirect()->route('admin.roles.index')->with('success', 'Role created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Role $role)
    {
        $users = $role->users()->paginate(10);

        return Inertia::render('Admin/Roles/Show', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'description' => $role->description,
                'created_at' => $role->created_at->format('Y-m-d H:i'),
            ],
            'users' => $users,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Role $role)
    {
        return Inertia::render('Admin/Roles/Edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'description' => $role->description,
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Role $role)
    {
        // Prevent editing system roles
        if (in_array($role->name, ['admin', 'user'])) {
            return redirect()->route('admin.roles.index')->with('error', 'Cannot edit system roles');
        }

        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name,' . $role->id,
            'description' => 'nullable|string',
        ]);

        $role->update($validated);

        return redirect()->route('admin.roles.index')->with('success', 'Role updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Role $role)
    {
        // Prevent deleting system roles
        if (in_array($role->name, ['admin', 'user'])) {
            return redirect()->route('admin.roles.index')->with('error', 'Cannot delete system roles');
        }

        // Check if role has users
        if ($role->users()->count() > 0) {
            return redirect()->route('admin.roles.index')->with('error', 'Cannot delete role with users');
        }

        $role->delete();

        return redirect()->route('admin.roles.index')->with('success', 'Role deleted successfully');
    }
}
