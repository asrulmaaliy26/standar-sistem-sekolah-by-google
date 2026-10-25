<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\Kamar;
use App\Models\PondokSetoran;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PondokController extends Controller
{
    /**
     * Tampilan Menu Pondok Pesantren untuk Guru / Ustadz
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // 1. Ambil Semua Kamar Asrama beserta Santri Penghuninya
        $kamars = Kamar::with([
            'pembina:id,name,email',
            'santri' => function ($q) {
                $q->select('id', 'name', 'email', 'kamar_id', 'rombel_id', 'madin_kelas_id')
                  ->with('rombel:id,name', 'madinKelas:id,nama_kelas')
                  ->orderBy('name');
            },
        ])->orderBy('nama_kamar')->get();

        // 2. Query Riwayat Setoran Santri
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

        $setorans = $query->paginate(15)->withQueryString();

        // Semua santri untuk modal input setoran
        $allSantri = User::whereHas('roles', fn($q) => $q->where('name', 'murid'))
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'kamar_id']);

        // 3. Ringkasan Statistik
        $today = now()->toDateString();
        $totalHariIni = PondokSetoran::whereDate('tanggal', $today)->count();
        $totalBulanIni = PondokSetoran::whereMonth('tanggal', now()->month)
            ->whereYear('tanggal', now()->year)->count();
        $santriAktifCount = PondokSetoran::whereMonth('tanggal', now()->month)
            ->distinct('santri_id')->count('santri_id');
        $setoranSaya = PondokSetoran::where('ustadz_id', $user->id)
            ->whereMonth('tanggal', now()->month)->count();

        // 4. Jadwal Rutinitas Santri Harian Pesantren
        $jadwalRutinitas = [
            [
                'waktu' => '03.30 - 05.00',
                'nama'  => 'Qiyamul Lail & Sholat Shubuh Berjamaah',
                'lokasi' => 'Masjid Pesantren',
                'keterangan' => 'Bangun malam, tahajjud, witir, dan sholat shubuh berjamaah',
            ],
            [
                'waktu' => '05.00 - 06.15',
                'nama'  => 'Halaqah Tahfidz & Muroja\'ah Shubuh',
                'lokasi' => 'Halaqah Kamar & Masjid',
                'keterangan' => 'Setoran hafalan baru dan muroja\'ah bersama Ustadz pembina',
            ],
            [
                'waktu' => '06.30 - 13.30',
                'nama'  => 'Sekolah Formal (TK/MI/MTs/MA)',
                'lokasi' => 'Gedung Madrasah Formal',
                'keterangan' => 'Pembelajaran kurikulum formal nasional & Google Classroom',
            ],
            [
                'waktu' => '15.30 - 17.00',
                'nama'  => 'Madrasah Diniyah (Madin) Sore',
                'lokasi' => 'Ruang Kelas Diniyah',
                'keterangan' => 'Kajian Nahwu, Shorof, Fiqih, Akhlaq, dan Hadits',
            ],
            [
                'waktu' => '18.00 - 19.30',
                'nama'  => 'Sholat Maghrib & Sorogan Kitab Kuning',
                'lokasi' => 'Masjid & Asrama Pondok',
                'keterangan' => 'Sorogan kitab kuning dan tadarus Al-Qur\'an ba\'da maghrib',
            ],
            [
                'waktu' => '19.45 - 21.30',
                'nama'  => 'Sholat Isya\' & Mudzakarah Terbimbing',
                'lokasi' => 'Asrama Masing-masing',
                'keterangan' => 'Belajar mandiri terbimbing dan musyawarah bahtsul masail',
            ],
            [
                'waktu' => '22.00',
                'nama'  => 'Jam Malam & Istirahat Santri',
                'lokasi' => 'Kamar Asrama',
                'keterangan' => 'Lampu utama asrama dipadamkan untuk istirahat',
            ],
        ];

        return Inertia::render('Guru/Pondok/Index', [
            'kamars'          => $kamars,
            'setorans'        => $setorans,
            'allSantri'       => $allSantri,
            'stats'           => [
                'total_hari_ini'     => $totalHariIni,
                'total_bulan_ini'    => $totalBulanIni,
                'santri_aktif_count' => $santriAktifCount,
                'setoran_saya'       => $setoranSaya,
            ],
            'jadwalRutinitas' => $jadwalRutinitas,
            'filters'         => [
                'search'   => $request->search ?? '',
                'kamar_id' => $request->kamar_id ?? 'all',
                'kategori' => $request->kategori ?? 'all',
                'status'   => $request->status ?? 'all',
                'tanggal'  => $request->tanggal ?? '',
            ],
        ]);
    }

    /**
     * Simpan Catatan Setoran Baru oleh Ustadz
     */
    public function storeSetoran(Request $request)
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
    public function destroySetoran($id)
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
                // Setoran terakhir sebelumnya
                $lastSetoran = PondokSetoran::where('santri_id', $santri->id)
                    ->latest('tanggal')
                    ->latest('id')
                    ->first();

                // Setoran pada tanggal yang dipilih
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
            'backUrl'       => route('guru.pondok.index'),
            'postUrl'       => route('guru.pondok.setoran.store'),
        ]);
    }
}
