<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * Update rombel_id for the current user.
     */
    public function updateRombel(Request $request)
    {
        // Hanya boleh update jika rombel_id masih null
        if (auth()->user()->rombel_id !== null) {
            return redirect()->back()->with('error', 'Anda sudah memilih kelas dan tidak dapat mengubahnya lagi.');
        }

        $validated = $request->validate([
            'rombel_id' => 'required|exists:rombels,id',
        ]);

        auth()->user()->update([
            'rombel_id' => $validated['rombel_id'],
        ]);

        return redirect()->back()->with('success', 'Kelas berhasil disimpan.');
    }

    /**
     * Verify the student card based on QR code scan result.
     */
    public function verifyCard(Request $request)
    {
        $request->validate([
            'kartu' => 'required|image|max:10240',
        ]);

        $file = $request->file('kartu');
        $filename = 'kartu_santri_' . auth()->id() . '_' . time() . '.' . $file->extension();
        $path = $file->storeAs('kartu_santri', $filename, 'public');

        auth()->user()->update([
            'is_verified' => true,
            'kartu_santri_path' => $path,
        ]);

        return redirect()->back()->with('success', 'Kartu Santri berhasil diunggah dan disimpan.');
    }
}
