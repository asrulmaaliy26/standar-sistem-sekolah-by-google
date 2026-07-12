<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\ClassroomLink;
use App\Models\Jenjang;
use App\Models\Rombel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClassroomLinkController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Hanya ambil link yang dibuat oleh guru yang sedang login
        $links = ClassroomLink::with('rombel.jenjang')
            ->where('guru_id', auth()->id())
            ->latest()
            ->get();
            
        $rombels = Rombel::with('jenjang')->orderBy('name')->get();
        $jenjangList = Jenjang::orderBy('nama')->get();

        return Inertia::render('Guru/ClassroomLinks/Index', [
            'links' => $links,
            'rombels' => $rombels,
            'jenjangList' => $jenjangList,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'rombel_id' => 'required|exists:rombels,id',
            'mapel' => 'required|string|max:255',
            'link' => 'nullable|url|max:2048',
            'link_uts' => 'nullable|url|max:2048',
            'uts_mulai' => 'nullable|date',
            'uts_tutup' => 'nullable|date|after_or_equal:uts_mulai',
            'uts_durasi' => 'nullable|integer|min:1',
            'link_uas' => 'nullable|url|max:2048',
            'uas_mulai' => 'nullable|date',
            'uas_tutup' => 'nullable|date|after_or_equal:uas_mulai',
            'uas_durasi' => 'nullable|integer|min:1',
            'keterangan' => 'nullable|string',
        ]);

        ClassroomLink::create([
            'guru_id' => auth()->id(),
            'rombel_id' => $validated['rombel_id'],
            'mapel' => $validated['mapel'],
            'link' => $validated['link'] ?? null,
            'link_uts' => $validated['link_uts'] ?? null,
            'uts_mulai' => $validated['uts_mulai'] ?? null,
            'uts_tutup' => $validated['uts_tutup'] ?? null,
            'uts_durasi' => $validated['uts_durasi'] ?? null,
            'link_uas' => $validated['link_uas'] ?? null,
            'uas_mulai' => $validated['uas_mulai'] ?? null,
            'uas_tutup' => $validated['uas_tutup'] ?? null,
            'uas_durasi' => $validated['uas_durasi'] ?? null,
            'keterangan' => $validated['keterangan'] ?? null,
        ]);

        return redirect()->route('guru.classroom-links.index')->with('success', 'Tautan Classroom berhasil ditambahkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $link = ClassroomLink::where('guru_id', auth()->id())->findOrFail($id);

        $validated = $request->validate([
            'rombel_id' => 'required|exists:rombels,id',
            'mapel' => 'required|string|max:255',
            'link' => 'nullable|url|max:2048',
            'link_uts' => 'nullable|url|max:2048',
            'uts_mulai' => 'nullable|date',
            'uts_tutup' => 'nullable|date|after_or_equal:uts_mulai',
            'uts_durasi' => 'nullable|integer|min:1',
            'link_uas' => 'nullable|url|max:2048',
            'uas_mulai' => 'nullable|date',
            'uas_tutup' => 'nullable|date|after_or_equal:uas_mulai',
            'uas_durasi' => 'nullable|integer|min:1',
            'keterangan' => 'nullable|string',
        ]);

        $link->update([
            'rombel_id' => $validated['rombel_id'],
            'mapel' => $validated['mapel'],
            'link' => $validated['link'] ?? null,
            'link_uts' => $validated['link_uts'] ?? null,
            'uts_mulai' => $validated['uts_mulai'] ?? null,
            'uts_tutup' => $validated['uts_tutup'] ?? null,
            'uts_durasi' => $validated['uts_durasi'] ?? null,
            'link_uas' => $validated['link_uas'] ?? null,
            'uas_mulai' => $validated['uas_mulai'] ?? null,
            'uas_tutup' => $validated['uas_tutup'] ?? null,
            'uas_durasi' => $validated['uas_durasi'] ?? null,
            'keterangan' => $validated['keterangan'] ?? null,
        ]);

        return redirect()->route('guru.classroom-links.index')->with('success', 'Tautan Classroom berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ClassroomLink $classroomLink)
    {
        // Pastikan hanya pemilik yang bisa menghapus
        if ($classroomLink->guru_id !== auth()->id()) {
            abort(403, 'Unauthorized action.');
        }

        $classroomLink->delete();

        return redirect()->route('guru.classroom-links.index')->with('success', 'Tautan Classroom berhasil dihapus.');
    }
}
