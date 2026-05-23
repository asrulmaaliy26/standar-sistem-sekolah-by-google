<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\ClassroomLink;
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
        $links = ClassroomLink::with('rombel')
            ->where('guru_id', auth()->id())
            ->latest()
            ->get();
            
        $rombels = Rombel::orderBy('name')->get();

        return Inertia::render('Guru/ClassroomLinks/Index', [
            'links' => $links,
            'rombels' => $rombels
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
            'link' => 'required|url|max:2048',
            'keterangan' => 'nullable|string',
        ]);

        ClassroomLink::create([
            'guru_id' => auth()->id(),
            'rombel_id' => $validated['rombel_id'],
            'mapel' => $validated['mapel'],
            'link' => $validated['link'],
            'keterangan' => $validated['keterangan'] ?? null,
        ]);

        return redirect()->route('guru.classroom-links.index')->with('success', 'Tautan Classroom berhasil ditambahkan.');
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
