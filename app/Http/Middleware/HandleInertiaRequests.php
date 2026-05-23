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

        $rombels = [];
        if ($request->user()) {
            $mode = $request->user()->getActiveNavigationMode();
            $isSiswa = ($mode['type'] === 'role' && $mode['value'] === 'murid')
                || ($request->user()->roles->pluck('name')->contains('murid'));
            if ($isSiswa && $request->user()->rombel_id === null) {
                $rombels = \App\Models\Rombel::with('jenjang:id,nama')->orderBy('name')->get(['id', 'name', 'jenjang_id']);
            }
        }

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

                    return [
                        ...$user->toArray(),
                        'active_mode' => $user->getActiveNavigationMode(),
                        'is_admin'    => $user->isAdmin(),
                        'is_verified' => (bool)$user->is_verified,
                        'roles'       => $user->roles->pluck('name'),
                        'jabatan'     => $user->jabatan->map(fn($j) => [
                            'id'   => $j->id,
                            'name' => $j->name,
                        ])->values(),
                    ];
                })(),
                'is_impersonating' => session()->has('impersonated_by'),
            ],
            'ziggy' => fn(): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'rombels' => $rombels,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
        ];
    }
}
