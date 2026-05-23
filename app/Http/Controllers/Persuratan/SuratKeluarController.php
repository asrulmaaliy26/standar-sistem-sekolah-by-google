<?php

namespace App\Http\Controllers\Persuratan;

use App\Http\Controllers\Controller;
use App\Models\SuratKeluar;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class SuratKeluarController extends Controller
{
    public function index(Request $request)
    {
        $query = SuratKeluar::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('no_surat', 'like', "%{$search}%")
                  ->orWhere('tujuan', 'like', "%{$search}%")
                  ->orWhere('perihal', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $suratKeluar = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Admin/Persuratan/SuratKeluar/Index', [
            'suratKeluar' => $suratKeluar,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Persuratan/SuratKeluar/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tanggal_surat' => 'required|date',
            'tujuan' => 'required|string|max:255',
            'perihal' => 'required|string',
            'isi_surat' => 'nullable|string',
            'penandatangan' => 'nullable|string|max:255',
            'file_surat' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'status' => 'required|in:Draft,Dikirim',
        ]);

        // Generate No Surat Otomatis
        $year = date('Y', strtotime($validated['tanggal_surat']));
        $month = date('n', strtotime($validated['tanggal_surat']));
        $romawi = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
        $bulanRomawi = $romawi[$month - 1];

        $lastSurat = SuratKeluar::whereYear('tanggal_surat', $year)->orderBy('id', 'desc')->first();
        if ($lastSurat && strpos($lastSurat->no_surat, '/') !== false) {
            $nextNumber = intval(explode('/', $lastSurat->no_surat)[0]) + 1;
        } else {
            $nextNumber = 1;
        }
        
        $noSurat = str_pad($nextNumber, 3, '0', STR_PAD_LEFT) . '/SM/INSTANSI/' . $bulanRomawi . '/' . $year;

        $validated['no_surat'] = $noSurat;

        if ($request->hasFile('file_surat')) {
            $path = $request->file('file_surat')->store('surat_keluar', 'public');
            $validated['file_surat'] = $path;
        }

        SuratKeluar::create($validated);

        return redirect()->route('admin.surat-keluar.index')->with('success', 'Surat Keluar berhasil dibuat.');
    }

    public function show(SuratKeluar $suratKeluar)
    {
        return Inertia::render('Admin/Persuratan/SuratKeluar/Show', [
            'surat' => $suratKeluar
        ]);
    }

    public function edit(SuratKeluar $suratKeluar)
    {
        return Inertia::render('Admin/Persuratan/SuratKeluar/Edit', [
            'surat' => $suratKeluar
        ]);
    }

    public function update(Request $request, SuratKeluar $suratKeluar)
    {
        $validated = $request->validate([
            'no_surat' => 'required|string|max:100',
            'tanggal_surat' => 'required|date',
            'tujuan' => 'required|string|max:255',
            'perihal' => 'required|string',
            'isi_surat' => 'nullable|string',
            'penandatangan' => 'nullable|string|max:255',
            'file_surat' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'status' => 'required|in:Draft,Dikirim',
        ]);

        if ($request->hasFile('file_surat')) {
            if ($suratKeluar->file_surat && Storage::disk('public')->exists($suratKeluar->file_surat)) {
                Storage::disk('public')->delete($suratKeluar->file_surat);
            }
            $path = $request->file('file_surat')->store('surat_keluar', 'public');
            $validated['file_surat'] = $path;
        }

        $suratKeluar->update($validated);

        return redirect()->route('admin.surat-keluar.index')->with('success', 'Surat Keluar berhasil diperbarui.');
    }

    public function destroy(SuratKeluar $suratKeluar)
    {
        if ($suratKeluar->file_surat && Storage::disk('public')->exists($suratKeluar->file_surat)) {
            Storage::disk('public')->delete($suratKeluar->file_surat);
        }
        
        $suratKeluar->delete();

        return redirect()->route('admin.surat-keluar.index')->with('success', 'Surat Keluar berhasil dihapus.');
    }
}
