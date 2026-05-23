<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Jenjang;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JenjangController extends Controller
{
    public function index()
    {
        $jenjang = Jenjang::withCount(['rombels', 'users'])
            ->orderBy('nama')
            ->get();

        return Inertia::render('Admin/Jenjang/Index', [
            'jenjang' => $jenjang,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama'     => 'required|string|max:255',
            'lokasi'   => 'nullable|string|max:255',
            'deskripsi'=> 'nullable|string|max:1000',
        ]);

        Jenjang::create($validated);

        return redirect()->route('admin.jenjang.index')->with('success', 'Jenjang berhasil ditambahkan.');
    }

    public function update(Request $request, Jenjang $jenjang)
    {
        $validated = $request->validate([
            'nama'     => 'required|string|max:255',
            'lokasi'   => 'nullable|string|max:255',
            'deskripsi'=> 'nullable|string|max:1000',
        ]);

        $jenjang->update($validated);

        return redirect()->route('admin.jenjang.index')->with('success', 'Jenjang berhasil diperbarui.');
    }

    public function destroy(Jenjang $jenjang)
    {
        $jenjang->delete();

        return redirect()->route('admin.jenjang.index')->with('success', 'Jenjang berhasil dihapus.');
    }
}
