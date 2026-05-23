<?php

namespace App\Http\Controllers\Persuratan;

use App\Http\Controllers\Controller;
use App\Models\SuratMasuk;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class SuratMasukController extends Controller
{
    public function index(Request $request)
    {
        $query = SuratMasuk::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('no_surat', 'like', "%{$search}%")
                  ->orWhere('pengirim', 'like', "%{$search}%")
                  ->orWhere('perihal', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $suratMasuk = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Admin/Persuratan/SuratMasuk/Index', [
            'suratMasuk' => $suratMasuk,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Persuratan/SuratMasuk/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'no_surat' => 'nullable|string|max:100',
            'tanggal_surat' => 'required|date',
            'tanggal_terima' => 'nullable|date',
            'pengirim' => 'required|string|max:255',
            'perihal' => 'required|string',
            'sifat' => 'required|in:Biasa,Penting,Rahasia',
            'lampiran' => 'nullable|string|max:100',
            'file_surat' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120', // max 5MB
            'status' => 'required|in:Baru,Diproses,Selesai',
        ]);

        // Generate No Agenda
        $year = date('Y');
        $lastSurat = SuratMasuk::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $nextNumber = $lastSurat ? intval(explode('/', $lastSurat->no_agenda)[0]) + 1 : 1;
        $noAgenda = str_pad($nextNumber, 4, '0', STR_PAD_LEFT) . '/' . $year;

        $validated['no_agenda'] = $noAgenda;

        if ($request->hasFile('file_surat')) {
            $path = $request->file('file_surat')->store('surat_masuk', 'public');
            $validated['file_surat'] = $path;
        }

        SuratMasuk::create($validated);

        return redirect()->route('admin.surat-masuk.index')->with('success', 'Surat Masuk berhasil ditambahkan.');
    }

    public function show(SuratMasuk $suratMasuk)
    {
        return Inertia::render('Admin/Persuratan/SuratMasuk/Show', [
            'surat' => $suratMasuk
        ]);
    }

    public function edit(SuratMasuk $suratMasuk)
    {
        return Inertia::render('Admin/Persuratan/SuratMasuk/Edit', [
            'surat' => $suratMasuk
        ]);
    }

    public function update(Request $request, SuratMasuk $suratMasuk)
    {
        $validated = $request->validate([
            'no_surat' => 'nullable|string|max:100',
            'tanggal_surat' => 'required|date',
            'tanggal_terima' => 'nullable|date',
            'pengirim' => 'required|string|max:255',
            'perihal' => 'required|string',
            'sifat' => 'required|in:Biasa,Penting,Rahasia',
            'lampiran' => 'nullable|string|max:100',
            'file_surat' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'status' => 'required|in:Baru,Diproses,Selesai',
        ]);

        if ($request->hasFile('file_surat')) {
            // Hapus file lama jika ada
            if ($suratMasuk->file_surat && Storage::disk('public')->exists($suratMasuk->file_surat)) {
                Storage::disk('public')->delete($suratMasuk->file_surat);
            }
            $path = $request->file('file_surat')->store('surat_masuk', 'public');
            $validated['file_surat'] = $path;
        }

        $suratMasuk->update($validated);

        return redirect()->route('admin.surat-masuk.index')->with('success', 'Surat Masuk berhasil diperbarui.');
    }

    public function destroy(SuratMasuk $suratMasuk)
    {
        if ($suratMasuk->file_surat && Storage::disk('public')->exists($suratMasuk->file_surat)) {
            Storage::disk('public')->delete($suratMasuk->file_surat);
        }
        
        $suratMasuk->delete();

        return redirect()->route('admin.surat-masuk.index')->with('success', 'Surat Masuk berhasil dihapus.');
    }
}
