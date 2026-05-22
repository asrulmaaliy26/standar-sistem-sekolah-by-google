<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user if not exists
        User::firstOrCreate(
            ['email' => 'lostsaga06k@gmail.com'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );

        // Create test user if not exists
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );

        // Call RoleSeeder
        $this->call(RoleSeeder::class);

        // Call JabatanSeeder
        $this->call(JabatanSeeder::class);
    }
}
