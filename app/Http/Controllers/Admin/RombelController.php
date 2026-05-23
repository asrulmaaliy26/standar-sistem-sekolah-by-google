<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Jenjang;
use App\Models\Rombel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RombelController extends Controller
{
    public function index()
    {
        $rombels = Rombel::with('jenjang')
            ->withCount('users')
            ->orderBy('name')
            ->get()
            ->map(fn($r) => [
                'id'        => $r->id,
                'name'      => $r->name,
                'lokasi'    => $r->lokasi,
                'users_count' => $r->users_count,
                'jenjang_id' => $r->jenjang_id,
                'jenjang'   => $r->jenjang ? ['id' => $r->jenjang->id, 'nama' => $r->jenjang->nama] : null,
            ]);

        $jenjang = Jenjang::orderBy('nama')->get(['id', 'nama']);

        return Inertia::render('Admin/Rombels/Index', [
            'rombels' => $rombels,
            'jenjang' => $jenjang,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'lokasi'    => 'nullable|string|max:255',
            'jenjang_id' => 'nullable|exists:jenjang,id',
        ]);

        Rombel::create($validated);

        return redirect()->route('admin.rombels.index')->with('success', 'Kelas berhasil ditambahkan.');
    }

    public function show(Rombel $rombel)
    {
        $rombel->load('jenjang');

        $users = $rombel->users()
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('Admin/Rombels/Show', [
            'rombel' => [
                'id' => $rombel->id,
                'name' => $rombel->name,
                'lokasi' => $rombel->lokasi,
                'jenjang' => $rombel->jenjang ? $rombel->jenjang->nama : 'Tanpa Jenjang'
            ],
            'users' => $users
        ]);
    }

    public function update(Request $request, Rombel $rombel)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'lokasi'    => 'nullable|string|max:255',
            'jenjang_id' => 'nullable|exists:jenjang,id',
        ]);

        $rombel->update($validated);

        return redirect()->route('admin.rombels.index')->with('success', 'Kelas berhasil diperbarui.');
    }

    public function destroy(Rombel $rombel)
    {
        $rombel->delete();

        return redirect()->route('admin.rombels.index')->with('success', 'Kelas berhasil dihapus.');
    }
}
