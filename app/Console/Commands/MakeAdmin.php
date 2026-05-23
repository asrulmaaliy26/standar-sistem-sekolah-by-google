<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'make:admin {email} {--remove}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Make a user an admin or remove admin role';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $removeFlag = $this->option('remove');

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email {$email} not found!");
            return 1;
        }

        if ($removeFlag) {
            $user->removeRole('superadmin');
            $this->info("Admin role removed from user {$user->name}.");
        } else {
            $user->assignRole('superadmin');
            $this->info("User {$user->name} is now an admin.");
        }

        return 0;
    }
}
