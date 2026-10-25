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
            $user = $request->user();
            $mode = $user->getActiveNavigationMode();
            $isSiswa = ($mode['type'] === 'role' && $mode['value'] === 'murid')
                || ($user->roles->pluck('name')->contains('murid'));
            $isAdmin = $user->isAdmin() || $user->roles->pluck('name')->contains('superadmin');

            if (($isSiswa && $user->rombel_id === null) || $isAdmin) {
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

                    // Pastikan role/jabatan/rombel/kamar/madin tersedia di frontend.
                    $user->loadMissing('roles', 'jabatan', 'rombel', 'kamar', 'madinKelas');

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
                        'rombel'      => $user->rombel ? [
                            'id'   => $user->rombel->id,
                            'name' => $user->rombel->name,
                        ] : null,
                        'kamar'       => $user->kamar ? [
                            'id'         => $user->kamar->id,
                            'nama_kamar' => $user->kamar->nama_kamar,
                            'gedung'     => $user->kamar->gedung,
                        ] : null,
                        'madin_kelas' => $user->madinKelas ? [
                            'id'         => $user->madinKelas->id,
                            'nama_kelas' => $user->madinKelas->nama_kelas,
                            'tingkat'    => $user->madinKelas->tingkat,
                        ] : null,
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
            'settings' => [
                'kartu_santri_aktif' => \App\Models\AppSetting::kartuSantriAktif(),
                'db_sync_enabled'    => \App\Services\DatabaseSyncService::isLocal()
                    && ! empty(\App\Services\DatabaseSyncService::getVpsUrl()),
            ],
        ];
    }
}
