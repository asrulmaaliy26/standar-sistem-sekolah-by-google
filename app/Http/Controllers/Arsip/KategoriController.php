<?php

namespace App\Http\Controllers\Arsip;

use App\Http\Controllers\Controller;
use App\Models\ArsipKategori;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KategoriController extends Controller
{
    /**
     * Hanya user dengan jabatan aktif "kepala sekolah" yang bisa CRUD kategori.
     */
    private function authorizeKepalaSekolah(Request $request): bool
    {
        $user       = $request->user();
        $activeMode = $user->getActiveNavigationMode();

        // Izin: admin selalu bisa, atau jabatan aktif adalah kepala sekolah
        if ($user->isAdmin()) return true;

        if ($activeMode['type'] === 'jabatan' && $activeMode['value'] === 'kepala sekolah') {
            return true;
        }

        // Cek apakah user punya jabatan kepala sekolah (walau tidak aktif)
        $user->loadMissing('jabatan');
        return $user->jabatan->pluck('name')->contains('kepala sekolah');
    }

    public function index()
    {
        $kategori = ArsipKategori::withCount('files')
            ->with('creator:id,name')
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn($k) => [
                'id'          => $k->id,
                'name'        => $k->name,
                'slug'        => $k->slug,
                'description' => $k->description,
                'color'       => $k->color,
                'files_count' => $k->files_count,
                'created_by'  => $k->creator?->name,
                'created_at'  => $k->created_at->format('Y-m-d H:i'),
            ]);

        return response()->json($kategori);
    }

    public function store(Request $request)
    {
        if (! $this->authorizeKepalaSekolah($request)) {
            return back()->with('error', 'Hanya Kepala Sekolah yang dapat membuat kategori arsip.');
        }

        $validated = $request->validate([
            'name'        => 'required|string|max:100|unique:arsip_kategori,name',
            'description' => 'nullable|string|max:500',
            'color'       => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        ArsipKategori::create([
            ...$validated,
            'color'      => $validated['color'] ?? '#3B82F6',
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Kategori "' . $validated['name'] . '" berhasil dibuat.');
    }

    public function update(Request $request, ArsipKategori $kategori)
    {
        if (! $this->authorizeKepalaSekolah($request)) {
            return back()->with('error', 'Hanya Kepala Sekolah yang dapat mengedit kategori arsip.');
        }

        $validated = $request->validate([
            'name'        => 'required|string|max:100|unique:arsip_kategori,name,' . $kategori->id,
            'description' => 'nullable|string|max:500',
            'color'       => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $kategori->update($validated);

        return back()->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(Request $request, ArsipKategori $kategori)
    {
        if (! $this->authorizeKepalaSekolah($request)) {
            return back()->with('error', 'Hanya Kepala Sekolah yang dapat menghapus kategori arsip.');
        }

        if ($kategori->files()->count() > 0) {
            return back()->with('error', 'Kategori tidak dapat dihapus karena masih memiliki ' . $kategori->files()->count() . ' file.');
        }

        $kategori->delete();

        return back()->with('success', 'Kategori berhasil dihapus.');
    }
}
