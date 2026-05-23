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
            ['name' => 'superadmin'],
            ['description' => 'Administrator with full access']
        );

        $userRole = Role::firstOrCreate(
            ['name' => 'user'],
            ['description' => 'Regular user']
        );

        $userRole = Role::firstOrCreate(
            ['name' => 'murid'],
            ['description' => 'Regular murid']
        );

        $userRole = Role::firstOrCreate(
            ['name' => 'guru'],
            ['description' => 'Regular guru']
        );

        $adminAkademikRole = Role::firstOrCreate(
            ['name' => 'admin akademik'],
            ['description' => 'Admin yang mengelola data jenjang dan kelas']
        );

        $adminPersuratanRole = Role::firstOrCreate(
            ['name' => 'admin persuratan'],
            ['description' => 'Admin yang mengelola surat menyurat']
        );

        // Assign admin role to specific email
        $adminEmail = 'lpialhidayahkauman@gmail.com';
        $adminUser = User::where('email', $adminEmail)->first();

        if ($adminUser) {
            $adminUser->assignRole('superadmin');
            echo "\n✓ Role 'superadmin' assigned to {$adminEmail}\n";
        } else {
            echo "\n✗ User with email {$adminEmail} not found\n";
        }
    }
}
