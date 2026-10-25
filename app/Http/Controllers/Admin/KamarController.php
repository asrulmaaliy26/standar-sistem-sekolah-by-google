<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kamar;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KamarController extends Controller
{
    /**
     * Display a listing of kamars (Asrama Pondok).
     */
    public function index()
    {
        $kamars = Kamar::with(['pembina:id,name', 'santri:id,name,email,kamar_id,jenis_kelamin'])
            ->withCount('santri')
            ->orderBy('nama_kamar')
            ->get();

        // Daftar calon pembina (guru atau admin)
        $pembinas = User::whereHas('roles', fn($q) => $q->whereIn('name', ['guru', 'superadmin', 'admin pondok']))
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        // Daftar santri/murid yang tersedia
        $availableSantri = User::whereHas('roles', fn($q) => $q->where('name', 'murid'))
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'kamar_id', 'jenis_kelamin']);

        return Inertia::render('Admin/Kamars/Index', [
            'kamars'          => $kamars,
            'pembinas'        => $pembinas,
            'availableSantri' => $availableSantri,
        ]);
    }

    /**
     * Store a newly created kamar.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_kamar' => 'required|string|max:100',
            'gedung'     => 'nullable|string|max:100',
            'kapasitas'  => 'required|integer|min:1|max:100',
            'gender'     => 'required|in:L,P',
            'pembina_id' => 'nullable|exists:users,id',
            'keterangan' => 'nullable|string|max:500',
        ]);

        Kamar::create($validated);

        return redirect()->route('admin.kamars.index')->with('success', 'Kamar pondok berhasil ditambahkan.');
    }

    /**
     * Update the specified kamar.
     */
    public function update(Request $request, Kamar $kamar)
    {
        $validated = $request->validate([
            'nama_kamar' => 'required|string|max:100',
            'gedung'     => 'nullable|string|max:100',
            'kapasitas'  => 'required|integer|min:1|max:100',
            'gender'     => 'required|in:L,P',
            'pembina_id' => 'nullable|exists:users,id',
            'keterangan' => 'nullable|string|max:500',
        ]);

        $kamar->update($validated);

        return redirect()->route('admin.kamars.index')->with('success', 'Data kamar berhasil diperbarui.');
    }

    /**
     * Remove the specified kamar.
     */
    public function destroy(Kamar $kamar)
    {
        // Lepas relasi kamar santri yang menempati
        User::where('kamar_id', $kamar->id)->update(['kamar_id' => null]);

        $kamar->delete();

        return redirect()->route('admin.kamars.index')->with('success', 'Kamar berhasil dihapus.');
    }

    /**
     * Assign santri to this kamar.
     */
    public function assignSantri(Request $request, Kamar $kamar)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        // Cek kapasitas
        if ($kamar->santri()->count() >= $kamar->kapasitas) {
            return redirect()->back()->with('error', 'Kapasitas kamar sudah penuh.');
        }

        $santri = User::findOrFail($validated['user_id']);
        $santri->update(['kamar_id' => $kamar->id]);

        return redirect()->back()->with('success', "{$santri->name} berhasil ditempatkan di kamar {$kamar->nama_kamar}.");
    }

    /**
     * Remove santri from this kamar.
     */
    public function removeSantri(Request $request, Kamar $kamar)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $santri = User::where('id', $validated['user_id'])->where('kamar_id', $kamar->id)->firstOrFail();
        $santri->update(['kamar_id' => null]);

        return redirect()->back()->with('success', "{$santri->name} dikeluarkan dari kamar {$kamar->nama_kamar}.");
    }
}
