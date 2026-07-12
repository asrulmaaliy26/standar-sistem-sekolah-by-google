<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleDriveAccount extends Model
{
    protected $fillable = [
        'email',
        'name',
        'refresh_token',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function arsipFiles()
    {
        return $this->hasMany(ArsipFile::class, 'google_drive_account_id');
    }

    public function getGoogleClient(): ?\Google\Client
    {
        if (!$this->refresh_token) {
            return null;
        }

        $client = new \Google\Client();
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setRedirectUri(config('services.google.redirect'));
        $client->setScopes([\Google\Service\Drive::DRIVE_FILE]);
        $client->setAccessType('offline');

        try {
            $client->fetchAccessTokenWithRefreshToken($this->refresh_token);
        } catch (\Exception $e) {
            return null;
        }

        return $client;
    }
}
