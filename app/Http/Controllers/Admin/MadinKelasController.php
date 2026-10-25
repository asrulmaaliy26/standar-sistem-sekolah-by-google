<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MadinKelas;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MadinKelasController extends Controller
{
    /**
     * Display a listing of Madrasah Diniyah classes.
     */
    public function index()
    {
        $madinKelas = MadinKelas::with(['waliKelas:id,name', 'santri:id,name,email,madin_kelas_id'])
            ->withCount(['santri', 'classroomLinks'])
            ->orderBy('tingkat')
            ->orderBy('nama_kelas')
            ->get();

        // Daftar calon wali kelas (ustadz/guru)
        $walis = User::whereHas('roles', fn($q) => $q->whereIn('name', ['guru', 'superadmin', 'admin akademik']))
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        // Daftar seluruh santri/murid
        $availableSantri = User::whereHas('roles', fn($q) => $q->where('name', 'murid'))
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'madin_kelas_id']);

        return Inertia::render('Admin/Madin/Index', [
            'madinKelas'      => $madinKelas,
            'walis'           => $walis,
            'availableSantri' => $availableSantri,
        ]);
    }

    /**
     * Store a newly created kelas madin.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_kelas'    => 'required|string|max:100',
            'tingkat'       => 'required|in:Ula,Wustho,Ulya',
            'wali_kelas_id' => 'nullable|exists:users,id',
            'deskripsi'     => 'nullable|string|max:500',
        ]);

        MadinKelas::create($validated);

        return redirect()->route('admin.madin-kelas.index')->with('success', 'Kelas Madin berhasil ditambahkan.');
    }

    /**
     * Update the specified kelas madin.
     */
    public function update(Request $request, MadinKelas $madinKela)
    {
        $validated = $request->validate([
            'nama_kelas'    => 'required|string|max:100',
            'tingkat'       => 'required|in:Ula,Wustho,Ulya',
            'wali_kelas_id' => 'nullable|exists:users,id',
            'deskripsi'     => 'nullable|string|max:500',
        ]);

        $madinKela->update($validated);

        return redirect()->route('admin.madin-kelas.index')->with('success', 'Data Kelas Madin berhasil diperbarui.');
    }

    /**
     * Remove the specified kelas madin.
     */
    public function destroy(MadinKelas $madinKela)
    {
        // Lepas santri dari kelas ini
        User::where('madin_kelas_id', $madinKela->id)->update(['madin_kelas_id' => null]);

        $madinKela->delete();

        return redirect()->route('admin.madin-kelas.index')->with('success', 'Kelas Madin berhasil dihapus.');
    }

    /**
     * Assign santri to this madin kelas.
     */
    public function assignSantri(Request $request, MadinKelas $madinKela)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $santri = User::findOrFail($validated['user_id']);
        $santri->update(['madin_kelas_id' => $madinKela->id]);

        return redirect()->back()->with('success', "{$santri->name} berhasil dimasukkan ke kelas {$madinKela->nama_kelas}.");
    }

    /**
     * Remove santri from this madin kelas.
     */
    public function removeSantri(Request $request, MadinKelas $madinKela)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $santri = User::where('id', $validated['user_id'])->where('madin_kelas_id', $madinKela->id)->firstOrFail();
        $santri->update(['madin_kelas_id' => null]);

        return redirect()->back()->with('success', "{$santri->name} dikeluarkan dari kelas {$madinKela->nama_kelas}.");
    }
}
