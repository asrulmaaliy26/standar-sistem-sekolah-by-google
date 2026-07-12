<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AppSettingController extends Controller
{
    /**
     * Toggle kartu santri aktif/nonaktif.
     * POST /admin/settings/kartu-santri-toggle
     */
    public function toggleKartuSantri(Request $request)
    {
        $user = Auth::user();

        if (!$user->hasRole('superadmin')) {
            abort(403, 'Hanya superadmin yang dapat mengubah pengaturan ini.');
        }

        $current = AppSetting::kartuSantriAktif();
        $newVal  = $current ? '0' : '1';

        AppSetting::set('kartu_santri_aktif', $newVal);

        return back()->with('success', 'Pengaturan Verifikasi Kartu Santri berhasil diperbarui.');
    }
}
