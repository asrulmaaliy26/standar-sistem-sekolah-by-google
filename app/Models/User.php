<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Session;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the roles that the user has.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles', 'user_id', 'role_id');
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole($role): bool
    {
        return $this->roles()->where('name', $role)->exists();
    }

    /**
     * Check if user is admin.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    /**
     * Assign a role to the user.
     */
    public function assignRole($role): void
    {
        $role = is_string($role) ? Role::where('name', $role)->first() : $role;
        if ($role && !$this->roles()->where('role_id', $role->id)->exists()) {
            $this->roles()->attach($role);
        }
    }

    /**
     * Remove a role from the user.
     */
    public function removeRole($role): void
    {
        $role = is_string($role) ? Role::where('name', $role)->first() : $role;
        if ($role) {
            $this->roles()->detach($role);
        }
    }

    /**
     * Get the jabatan that the user has.
     */
    public function jabatan(): BelongsToMany
    {
        return $this->belongsToMany(Jabatan::class, 'user_jabatan', 'user_id', 'jabatan_id');
    }

    /**
     * Check if user has a specific jabatan.
     */
    public function hasJabatan($jabatan): bool
    {
        return $this->jabatan()->where('name', $jabatan)->exists();
    }

    /**
     * Assign a jabatan to the user.
     */
    public function assignJabatan($jabatan): void
    {
        $jabatan = is_string($jabatan) ? Jabatan::where('name', $jabatan)->first() : $jabatan;
        if ($jabatan && !$this->jabatan()->where('jabatan_id', $jabatan->id)->exists()) {
            $this->jabatan()->attach($jabatan);
        }
    }

    /**
     * Remove a jabatan from the user.
     */
    public function removeJabatan($jabatan): void
    {
        $jabatan = is_string($jabatan) ? Jabatan::where('name', $jabatan)->first() : $jabatan;
        if ($jabatan) {
            $this->jabatan()->detach($jabatan);
        }
    }

    /**
     * Get the active navigation mode from session.
     * Returns array: ['type' => 'role'|'jabatan', 'value' => string]
     */
    public function getActiveNavigationMode(): array
    {
        $sessionKey = 'navigation_mode_' . $this->id;
        $stored = Session::get($sessionKey);

        if ($stored && isset($stored['type'], $stored['value'])) {
            return $stored;
        }

        // Default: gunakan role pertama user
        $primaryRole = $this->roles->first()?->name ?? 'user';

        return ['type' => 'role', 'value' => $primaryRole];
    }

    /**
     * Set the active navigation mode in session.
     */
    public function setNavigationMode(string $type, string $value): void
    {
        $sessionKey = 'navigation_mode_' . $this->id;
        Session::put($sessionKey, ['type' => $type, 'value' => $value]);
    }

    /**
     * Reset navigation mode to default role.
     */
    public function resetNavigationMode(): void
    {
        $sessionKey = 'navigation_mode_' . $this->id;
        Session::forget($sessionKey);
    }
}

