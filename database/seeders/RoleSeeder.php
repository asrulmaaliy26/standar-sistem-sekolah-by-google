<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\User;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create roles
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin'],
            ['description' => 'Administrator with full access']
        );

        $userRole = Role::firstOrCreate(
            ['name' => 'user'],
            ['description' => 'Regular user']
        );

        // Assign admin role to specific email
        $adminEmail = 'lostsaga06k@gmail.com';
        $adminUser = User::where('email', $adminEmail)->first();

        if ($adminUser) {
            $adminUser->assignRole('admin');
            echo "\n✓ Role 'admin' assigned to {$adminEmail}\n";
        } else {
            echo "\n✗ User with email {$adminEmail} not found\n";
        }

        // Assign user role to test user
        $testUser = User::where('email', 'test@example.com')->first();
        if ($testUser) {
            $testUser->assignRole('user');
            echo "✓ Role 'user' assigned to test@example.com\n\n";
        }
    }
}
