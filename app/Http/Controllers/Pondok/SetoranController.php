<?php

namespace App\Http\Controllers\Pondok;

use App\Http\Controllers\Controller;
use App\Models\Kamar;
use App\Models\PondokSetoran;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SetoranController extends Controller
{
    /**
     * Tampilan Pusat Setoran & Mutaba'ah Pondok (Ustadz & Admin)
     */
    public function index(Request $request)
    {
        $query = PondokSetoran::with([
            'santri:id,name,email,kamar_id,madin_kelas_id',
            'santri.kamar:id,nama_kamar',
            'ustadz:id,name',
        ])->latest('tanggal')->latest('id');

        // Filter Pencarian Santri
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('santri', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter Kamar
        if ($request->filled('kamar_id') && $request->kamar_id !== 'all') {
            $query->whereHas('santri', function ($q) use ($request) {
                $q->where('kamar_id', $request->kamar_id);
            });
        }

        // Filter Kategori
        if ($request->filled('kategori') && $request->kategori !== 'all') {
            $query->where('kategori', $request->kategori);
        }

        // Filter Status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter Tanggal
        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal', $request->tanggal);
        }

        $setorans = $query->paginate(20)->withQueryString();

        // Data Kamar beserta Santri untuk Modal Input
        $kamars = Kamar::with(['santri' => function ($q) {
            $q->select('id', 'name', 'email', 'kamar_id')->orderBy('name');
        }])->orderBy('nama_kamar')->get();

        // Semua santri (jika ada yang belum punya kamar tapi ingin diinputkan)
        $allSantri = User::whereHas('roles', fn($q) => $q->where('name', 'murid'))
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'kamar_id']);

        // Ringkasan Statistik
        $today = now()->toDateString();
        $totalHariIni = PondokSetoran::whereDate('tanggal', $today)->count();
        $totalBulanIni = PondokSetoran::whereMonth('tanggal', now()->month)
            ->whereYear('tanggal', now()->year)->count();
        $santriAktifCount = PondokSetoran::whereMonth('tanggal', now()->month)
            ->distinct('santri_id')->count('santri_id');

        return Inertia::render('Pondok/Setoran/Index', [
            'setorans'   => $setorans,
            'kamars'     => $kamars,
            'allSantri'  => $allSantri,
            'stats'      => [
                'total_hari_ini'     => $totalHariIni,
                'total_bulan_ini'    => $totalBulanIni,
                'santri_aktif_count' => $santriAktifCount,
            ],
            'filters'    => [
                'search'   => $request->search ?? '',
                'kamar_id' => $request->kamar_id ?? 'all',
                'kategori' => $request->kategori ?? 'all',
                'status'   => $request->status ?? 'all',
                'tanggal'  => $request->tanggal ?? '',
            ],
        ]);
    }

    /**
     * Simpan Catatan Setoran Baru
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'santri_id'    => 'required|exists:users,id',
            'tanggal'      => 'required|date',
            'kategori'     => 'required|in:tahfidz_quran,tahfidz_hadits,kitab,amalan',
            'kitab_surat'  => 'required|string|max:150',
            'halaman_ayat' => 'nullable|string|max:100',
            'status'       => 'required|in:lancar,mengulang,kurang_lancar,absen',
            'nilai'        => 'nullable|integer|min:0|max:100',
            'catatan'      => 'nullable|string|max:500',
        ]);

        $validated['ustadz_id'] = auth()->id();

        PondokSetoran::create($validated);

        return back()->with('success', 'Catatan setoran santri berhasil disimpan.');
    }

    /**
     * Hapus Catatan Setoran
     */
    public function destroy($id)
    {
        $setoran = PondokSetoran::findOrFail($id);
        $setoran->delete();

        return back()->with('success', 'Catatan setoran berhasil dihapus.');
    }

    /**
     * Halaman Input Setoran Khusus Per Kamar (Daftar Seluruh Santri di Kamar)
     */
    public function inputKamar(Request $request)
    {
        $kamars = Kamar::withCount('santri')->orderBy('nama_kamar')->get();

        $selectedKamarId = $request->kamar_id;
        $kamar = null;

        if ($selectedKamarId) {
            $kamar = Kamar::with('pembina:id,name,email')->find($selectedKamarId);
        }

        if (!$kamar && $kamars->isNotEmpty()) {
            $kamarWithSantri = $kamars->firstWhere('santri_count', '>', 0);
            $kamar = $kamarWithSantri 
                ? Kamar::with('pembina:id,name,email')->find($kamarWithSantri->id)
                : Kamar::with('pembina:id,name,email')->find($kamars->first()->id);
        }

        $tanggal = $request->input('tanggal', now()->toDateString());

        $santris = collect();
        $sudahSetorCount = 0;

        if ($kamar) {
            $santriList = User::where('kamar_id', $kamar->id)
                ->with('rombel:id,name', 'madinKelas:id,nama_kelas')
                ->orderBy('name')
                ->get();

            $santris = $santriList->map(function ($santri) use ($tanggal, &$sudahSetorCount) {
                $lastSetoran = PondokSetoran::where('santri_id', $santri->id)
                    ->latest('tanggal')
                    ->latest('id')
                    ->first();

                $todaySetorans = PondokSetoran::where('santri_id', $santri->id)
                    ->whereDate('tanggal', $tanggal)
                    ->with('ustadz:id,name')
                    ->latest('id')
                    ->get();

                $hasSetor = $todaySetorans->isNotEmpty();
                if ($hasSetor) {
                    $sudahSetorCount++;
                }

                return [
                    'id'              => $santri->id,
                    'name'            => $santri->name,
                    'email'           => $santri->email,
                    'nis'             => $santri->nis,
                    'jenis_kelamin'   => $santri->jenis_kelamin,
                    'rombel'          => $santri->rombel,
                    'madin_kelas'     => $santri->madinKelas,
                    'last_setoran'    => $lastSetoran,
                    'today_setorans'  => $todaySetorans,
                    'has_setor_today' => $hasSetor,
                ];
            });
        }

        $totalSantri = $santris->count();

        return Inertia::render('Pondok/Setoran/InputKamar', [
            'kamars'        => $kamars,
            'selectedKamar' => $kamar,
            'santris'       => $santris,
            'tanggal'       => $tanggal,
            'statsKamar'    => [
                'total_santri' => $totalSantri,
                'sudah_setor'  => $sudahSetorCount,
                'belum_setor'  => max(0, $totalSantri - $sudahSetorCount),
                'persentase'   => $totalSantri > 0 ? round(($sudahSetorCount / $totalSantri) * 100) : 0,
            ],
            'backUrl'       => route('admin.pondok.setoran.index'),
            'postUrl'       => route('admin.pondok.setoran.store'),
        ]);
    }
}
