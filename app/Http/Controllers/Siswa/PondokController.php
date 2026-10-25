<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\Kamar;
use App\Models\PondokSetoran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PondokController extends Controller
{
    /**
     * Tampilan Menu Pondok Pesantren untuk Santri / Murid
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // 1. Ambil Data Kamar Santri beserta Pembina & Teman Sekamar
        $kamar = null;
        $temanSekamar = collect();
        if ($user->kamar_id) {
            $kamar = Kamar::with('pembina:id,name,email')->find($user->kamar_id);
            if ($kamar) {
                $temanSekamar = \App\Models\User::where('kamar_id', $kamar->id)
                    ->where('id', '!=', $user->id)
                    ->with('rombel:id,name', 'madinKelas:id,nama_kelas')
                    ->get(['id', 'name', 'email', 'rombel_id', 'madin_kelas_id', 'jenis_kelamin']);
            }
        }

        // 2. Ambil Riwayat Mutaba'ah & Setoran Santri
        $querySetoran = PondokSetoran::with('ustadz:id,name')
            ->where('santri_id', $user->id)
            ->latest('tanggal')
            ->latest('id');

        if ($request->filled('kategori') && $request->kategori !== 'semua') {
            $querySetoran->where('kategori', $request->kategori);
        }

        $setorans = $querySetoran->paginate(15)->withQueryString();

        // 3. Statistik Setoran Santri
        $allSetorans = PondokSetoran::where('santri_id', $user->id)->get();
        $totalSetoran = $allSetorans->count();
        $setoranBulanIni = $allSetorans->filter(function ($item) {
            return \Carbon\Carbon::parse($item->tanggal)->isCurrentMonth();
        })->count();
        $totalLancar = $allSetorans->whereIn('status', ['lancar', 'mutqin'])->count();
        $terakhirSetor = $allSetorans->sortByDesc('tanggal')->first();

        // 4. Jadwal Rutinitas Santri Harian Pesantren
        $jadwalRutinitas = [
            [
                'waktu' => '03.30 - 05.00',
                'nama'  => 'Qiyamul Lail & Sholat Shubuh Berjamaah',
                'lokasi' => 'Masjid Pesantren',
                'keterangan' => 'Bangun malam, tahajjud, witir, dan sholat shubuh berjamaah',
                'icon'  => 'Moon',
            ],
            [
                'waktu' => '05.00 - 06.15',
                'nama'  => 'Halaqah Tahfidz & Muroja\'ah Shubuh',
                'lokasi' => 'Halaqah Kamar & Masjid',
                'keterangan' => 'Setoran hafalan baru dan muroja\'ah bersama Ustadz pembina',
                'icon'  => 'BookOpen',
            ],
            [
                'waktu' => '06.30 - 13.30',
                'nama'  => 'Sekolah Formal (TK/MI/MTs/MA)',
                'lokasi' => 'Gedung Madrasah Formal',
                'keterangan' => 'Pembelajaran kurikulum formal nasional & Google Classroom',
                'icon'  => 'School',
            ],
            [
                'waktu' => '15.30 - 17.00',
                'nama'  => 'Madrasah Diniyah (Madin) Sore',
                'lokasi' => 'Ruang Kelas Diniyah',
                'keterangan' => 'Kajian Nahwu, Shorof, Fiqih, Akhlaq, dan Hadits',
                'icon'  => 'GraduationCap',
            ],
            [
                'waktu' => '18.00 - 19.30',
                'nama'  => 'Sholat Maghrib & Sorogan Kitab Kuning',
                'lokasi' => 'Masjid & Asrama Pondok',
                'keterangan' => 'Sorogan kitab kuning dan tadarus Al-Qur\'an ba\'da maghrib',
                'icon'  => 'Sparkles',
            ],
            [
                'waktu' => '19.45 - 21.30',
                'nama'  => 'Sholat Isya\' & Mudzakarah Terbimbing',
                'lokasi' => 'Asrama Masing-masing',
                'keterangan' => 'Belajar mandiri terbimbing dan musyawarah bahtsul masail',
                'icon'  => 'Clock',
            ],
            [
                'waktu' => '22.00',
                'nama'  => 'Jam Malam & Istirahat Santri',
                'lokasi' => 'Kamar Asrama',
                'keterangan' => 'Lampu utama asrama dipadamkan untuk istirahat',
                'icon'  => 'Bed',
            ],
        ];

        return Inertia::render('Siswa/Pondok/Index', [
            'kamar'           => $kamar,
            'temanSekamar'    => $temanSekamar,
            'setorans'        => $setorans,
            'stats'           => [
                'total_setoran'      => $totalSetoran,
                'setoran_bulan_ini'  => $setoranBulanIni,
                'total_lancar'       => $totalLancar,
                'persentase_lancar'  => $totalSetoran > 0 ? round(($totalLancar / $totalSetoran) * 100) : 0,
                'terakhir_setor'     => $terakhirSetor ? [
                    'tanggal'      => \Carbon\Carbon::parse($terakhirSetor->tanggal)->translatedFormat('d F Y'),
                    'kategori'     => $terakhirSetor->kategori,
                    'kitab_surat'  => $terakhirSetor->kitab_surat,
                    'halaman_ayat' => $terakhirSetor->halaman_ayat,
                    'status'       => $terakhirSetor->status,
                ] : null,
            ],
            'jadwalRutinitas' => $jadwalRutinitas,
            'filters'         => [
                'kategori' => $request->input('kategori', 'semua'),
            ],
        ]);
    }
}
