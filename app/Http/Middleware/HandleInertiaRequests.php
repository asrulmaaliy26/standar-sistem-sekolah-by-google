<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => (function () use ($request) {
                    $user = $request->user();

                    if (! $user) {
                        return null;
                    }

                    // Pastikan role/jabatan tersedia di frontend untuk sidebar.
                    $user->loadMissing('roles', 'jabatan');

                    // Hitung active_mode SEBELUM roles di-overwrite jadi string collection,
                    // agar getActiveNavigationMode() bisa baca nama role dari Eloquent model.
                    $user->active_mode = $user->getActiveNavigationMode();

                    // Buat properti yang bisa dipakai langsung di React.
                    $user->is_admin = $user->isAdmin();
                    $user->roles    = $user->roles->pluck('name');
                    $user->jabatan  = $user->jabatan->map(fn($j) => [
                        'id'   => $j->id,
                        'name' => $j->name,
                    ])->values();

                    return $user;
                })(),
                'is_impersonating' => session()->has('impersonated_by'),
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
        ];
    }
}
