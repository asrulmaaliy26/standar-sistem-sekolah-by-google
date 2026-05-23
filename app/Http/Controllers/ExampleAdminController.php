<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Helpers\RoleHelper;
use Illuminate\Http\Request;

/**
 * Example Controller - Demonstrasi penggunaan Role System
 */
class ExampleAdminController extends Controller
{
    /**
     * Example: Admin Dashboard - Route ini dilindungi middleware
     */
    public function dashboard()
    {
        // User sudah terjamin admin karena middleware
        $user = auth()->user();

        return response()->json([
            'message' => 'Welcome Admin!',
            'user' => $user->only('id', 'name', 'email'),
            'roles' => $user->roles->pluck('name'),
            'is_admin' => $user->isAdmin(),
        ]);
    }

    /**
     * Example: List all users (admin only)
     */
    public function listUsers()
    {
        // Check authorization menggunakan model method
        if (!auth()->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $users = User::with('roles')->get();

        return response()->json([
            'users' => $users,
            'total' => $users->count(),
        ]);
    }

    /**
     * Example: Make user admin
     */
    public function makeAdmin(Request $request)
    {
        // Verify requester is admin
        if (!auth()->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        // Using helper function
        if (RoleHelper::makeAdminByEmail($validated['email'])) {
            return response()->json([
                'message' => "User {$validated['email']} is now admin",
                'success' => true,
            ]);
        }

        return response()->json([
            'message' => 'Failed to make user admin',
            'success' => false,
        ], 400);
    }

    /**
     * Example: Remove admin role
     */
    public function removeAdmin(Request $request)
    {
        if (!auth()->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        // Using helper function
        if (RoleHelper::removeAdminByEmail($validated['email'])) {
            return response()->json([
                'message' => "Admin role removed from {$validated['email']}",
                'success' => true,
            ]);
        }

        return response()->json([
            'message' => 'Failed to remove admin role',
            'success' => false,
        ], 400);
    }

    /**
     * Example: Get all admin users
     */
    public function getAdmins()
    {
        if (!auth()->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $admins = RoleHelper::getAllAdmins();

        return response()->json([
            'admins' => $admins->map(fn($admin) => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'roles' => $admin->roles->pluck('name'),
            ]),
            'total' => $admins->count(),
        ]);
    }

    /**
     * Example: Check user role
     */
    public function checkUserRole($userId)
    {
        $user = User::find($userId);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json([
            'user' => $user->only('id', 'name', 'email'),
            'roles' => $user->roles->pluck('name'),
            'is_admin' => $user->isAdmin(),
            'has_admin_role' => $user->hasRole('superadmin'),
        ]);
    }

    /**
     * Example: Protected action (admin only)
     */
    public function deleteUser(User $user)
    {
        // Multiple ways to check authorization:

        // Way 1: Via middleware (recommended for routes)
        // Applied in route definition with 'admin' middleware

        // Way 2: Via user method
        if (!auth()->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Way 3: Via helper
        if (!RoleHelper::userHasRole(auth()->id(), 'superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Delete user logic...
        $user->delete();

        return response()->json([
            'message' => "User {$user->email} deleted",
            'success' => true,
        ]);
    }
}
