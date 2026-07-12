<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Throwable;

class GoogleAuthController extends Controller
{
    public function redirect(Request $request)
    {
        $driver = Socialite::driver('google')
            ->scopes([
                'openid',
                'profile',
                'email',
            ]);

        if ($request->query('link_drive') == '1') {
            $request->session()->put('google_auth_action', 'link_drive');
            $driver->scopes(['https://www.googleapis.com/auth/drive.file'])
                   ->with(['access_type' => 'offline', 'prompt' => 'consent']);
        } else {
            $request->session()->forget('google_auth_action');
            if ($request->query('with_drive') == '1') {
                $driver->scopes(['https://www.googleapis.com/auth/drive.file'])
                       ->with(['access_type' => 'offline', 'prompt' => 'consent']);
            }
        }

        return $driver->redirect();
    }

    public function callback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            return redirect()->route('login')->with('error', 'Login dengan Google gagal. Silakan coba lagi.');
        }

        $action = $request->session()->pull('google_auth_action');

        if ($action === 'link_drive') {
            if (!Auth::check() || !Auth::user()->hasRole('superadmin')) {
                return redirect('/dashboard')->with('error', 'Akses ditolak.');
            }

            $account = \App\Models\GoogleDriveAccount::where('email', $googleUser->email)->first();
            if ($account) {
                $account->update([
                    'name' => $googleUser->name,
                    'refresh_token' => $googleUser->refreshToken ?? $account->refresh_token,
                    'is_active' => true,
                ]);
            } else {
                \App\Models\GoogleDriveAccount::create([
                    'email' => $googleUser->email,
                    'name' => $googleUser->name,
                    'refresh_token' => $googleUser->refreshToken ?? '',
                    'is_active' => true,
                ]);
            }

            return redirect()->route('settings.drive')->with('success', 'Akun Google Drive berhasil ditautkan!');
        }

        // Cari atau buat user berdasarkan email
        $user = User::where('email', $googleUser->email)->first();

        if ($user) {
            // Update token setiap login agar selalu fresh
            $user->update([
                'google_id'              => $googleUser->id,
                'google_token'           => $googleUser->token,
                'google_refresh_token'   => $googleUser->refreshToken ?? $user->google_refresh_token,
                'google_token_expires_at'=> now()->addSeconds($googleUser->expiresIn ?? 3600),
                'email_verified_at'      => $user->email_verified_at ?? now(),
            ]);
        } else {
            $user = User::create([
                'name'                   => $googleUser->name,
                'email'                  => $googleUser->email,
                'password'               => bcrypt(Str::random(16)),
                'google_id'              => $googleUser->id,
                'google_token'           => $googleUser->token,
                'google_refresh_token'   => $googleUser->refreshToken,
                'google_token_expires_at'=> now()->addSeconds($googleUser->expiresIn ?? 3600),
                'email_verified_at'      => now(),
            ]);
        }

        Auth::login($user);

        return redirect('/dashboard');
    }
}
