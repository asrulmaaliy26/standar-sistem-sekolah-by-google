<?php

namespace App\Helpers;

use App\Models\User;

class RoleHelper
{
    /**
     * Check if a user is admin by email.
     */
    public static function isAdminByEmail($email): bool
    {
        $user = User::where('email', $email)->first();
        return $user ? $user->isAdmin() : false;
    }

    /**
     * Make a user admin by email.
     */
    public static function makeAdminByEmail($email): bool
    {
        $user = User::where('email', $email)->first();
        if (!$user) {
            return false;
        }

        $user->assignRole('superadmin');
        return true;
    }

    /**
     * Remove admin role from user by email.
     */
    public static function removeAdminByEmail($email): bool
    {
        $user = User::where('email', $email)->first();
        if (!$user) {
            return false;
        }

        $user->removeRole('superadmin');
        return true;
    }

    /**
     * Get all admin users.
     */
    public static function getAllAdmins()
    {
        return User::whereHas('roles', function ($query) {
            $query->where('name', 'superadmin');
        })->get();
    }

    /**
     * Check if a user has a specific role.
     */
    public static function userHasRole($userId, $roleName): bool
    {
        $user = User::find($userId);
        return $user ? $user->hasRole($roleName) : false;
    }
}
