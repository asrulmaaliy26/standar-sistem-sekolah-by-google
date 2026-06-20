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
     * Boot the model.
     */
    protected static function booted(): void
    {
        static::created(function (User $user) {
            // Berikan role default 'murid' pada setiap pembuatan user baru
            $muridRole = \App\Models\Role::firstOrCreate(['name' => 'murid']);
            $user->assignRole($muridRole);
        });
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'google_token',
        'google_refresh_token',
        'google_token_expires_at',
        'email_verified_at',
        'rombel_id',
        'kartu_santri_path',
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
            'email_verified_at'       => 'datetime',
            'google_token_expires_at' => 'datetime',
            'password'                => 'hashed',
        ];
    }

    /**
     * Check apakah user sudah connect Google Drive (punya refresh token).
     */
    public function hasGoogleDriveAccess(): bool
    {
        return ! empty($this->google_refresh_token);
    }

    /**
     * Dapatkan user admin yang token Google Drive-nya digunakan untuk sistem.
     */
    public static function getSystemGoogleDriveUser(): ?self
    {
        return self::whereNotNull('google_refresh_token')
            ->whereHas('roles', fn($q) => $q->where('name', 'superadmin'))
            ->first();
    }

    /**
     * Build configured Google_Client dengan token user.
     * Return null jika user belum grant Drive access.
     */
    public function getGoogleClient(): ?\Google\Client
    {
        if (! $this->hasGoogleDriveAccess()) {
            return null;
        }

        $client = new \Google\Client();
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setRedirectUri(config('services.google.redirect'));
        $client->setScopes([
            \Google\Service\Drive::DRIVE_FILE,
        ]);
        $client->setAccessType('offline');

        $accessToken = [
            'access_token'  => $this->google_token,
            'refresh_token' => $this->google_refresh_token,
            'expires_in'    => 3600,
        ];

        $client->setAccessToken($accessToken);

        // Auto-refresh jika expired
        if ($client->isAccessTokenExpired()) {
            $client->fetchAccessTokenWithRefreshToken($this->google_refresh_token);
            $newToken = $client->getAccessToken();

            $this->update([
                'google_token'            => $newToken['access_token'],
                'google_token_expires_at' => now()->addSeconds($newToken['expires_in'] ?? 3600),
            ]);
        }

        return $client;
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
        $roleName = is_string($role) ? $role : $role->name;
        return $this->roles->contains('name', $roleName);
    }

    /**
     * Check if user is admin.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('superadmin');
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
        $jabatanName = is_string($jabatan) ? $jabatan : $jabatan->name;
        return $this->jabatan->contains('name', $jabatanName);
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

    /**
     * Get the rombel that the user belongs to.
     */
    public function rombel()
    {
        return $this->belongsTo(Rombel::class, 'rombel_id');
    }
}
