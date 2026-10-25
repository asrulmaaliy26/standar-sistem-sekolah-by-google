<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\ClassroomLink;
use App\Models\MadinKelas;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MadinController extends Controller
{
    /**
     * Tampilan Menu Madrasah Diniyah untuk Guru / Ustadz
     */
    public function index()
    {
        $user = auth()->user();

        // 1. Ambil Semua Kelas Madin beserta Wali Kelas & Santri Terdaftar
        $madinKelasList = MadinKelas::with([
            'waliKelas:id,name,email',
            'santri' => function ($q) {
                $q->select('id', 'name', 'email', 'madin_kelas_id', 'rombel_id', 'kamar_id')
                  ->with('rombel:id,name', 'kamar:id,nama_kamar')
                  ->orderBy('name');
            },
        ])->orderBy('tingkat')->orderBy('nama_kelas')->get();

        // 2. Ambil Tautan Google Classroom Khusus Madin
        // Tampilkan semua tautan madin, utamakan milik guru yang login
        $links = ClassroomLink::with(['guru:id,name', 'madinKelas:id,nama_kelas,tingkat'])
            ->where('kategori', 'madin')
            ->latest()
            ->get();

        // 3. Standar Kurikulum Kitab Per Tingkat
        $kurikulumStandar = [
            'Ula' => [
                ['mapel' => 'Fiqih Dasar', 'kitab' => 'Safinatun Naja / Mabadiul Fiqhiyyah', 'penulis' => 'Syaikh Salim bin Samir Al-Hadhrami'],
                ['mapel' => 'Aqidah & Tauhid', 'kitab' => 'Aqidatul Awam', 'penulis' => 'Sayyid Ahmad Al-Marzuqi'],
                ['mapel' => 'Akhlaq & Adab', 'kitab' => 'Taisirul Khalaq / Akhlaq Lil Banin', 'penulis' => 'Syaikh Hafizh Hasan Al-Mas\'udi'],
                ['mapel' => 'Tajwid & Al-Qur\'an', 'kitab' => 'Tuhfatul Athfal / Hidayatus Shibyan', 'penulis' => 'Syaikh Sulaiman Al-Jamzuri'],
                ['mapel' => 'Nahwu Pegon', 'kitab' => 'Kaidah Nahwu Dasar Pegon', 'penulis' => 'Ulama Nusantara'],
            ],
            'Wustho' => [
                ['mapel' => 'Fiqih Lanjutan', 'kitab' => 'Fathul Qorib Al-Mujib / Ghoyah Wat Taqrib', 'penulis' => 'Syaikh Ibnu Qasim Al-Ghazi'],
                ['mapel' => 'Nahwu Arab', 'kitab' => 'Matan Al-Jurumiyyah & Al-Imrithi', 'penulis' => 'Ibnu Ajurrum & Syaikh Syarafuddin Al-Imrithi'],
                ['mapel' => 'Shorof', 'kitab' => 'Al-Amtsilah At-Tashrifiyyah', 'penulis' => 'KH. Ma\'shum bin Ali Jombang'],
                ['mapel' => 'Hadits Tematik', 'kitab' => 'Hadits Al-Arba\'in An-Nawawiyyah', 'penulis' => 'Imam An-Nawawi'],
                ['mapel' => 'Tarikh Islam', 'kitab' => 'Khulashah Nurul Yaqin Juz 1 & 2', 'penulis' => 'Syaikh Umar Abdul Jabbar'],
            ],
            'Ulya' => [
                ['mapel' => 'Fiqih Tingkat Atas', 'kitab' => 'Fathul Mu\'in bi Syarhi Qurratil \'Ain', 'penulis' => 'Syaikh Zainuddin Al-Malibari'],
                ['mapel' => 'Gramatika Arab', 'kitab' => 'Alfiyyah Ibnu Malik', 'penulis' => 'Ibnu Malik'],
                ['mapel' => 'Ushul Fiqih', 'kitab' => 'Al-Waraqat / Al-Luma\'', 'penulis' => 'Imam Al-Haramain Al-Juwaini'],
                ['mapel' => 'Tafsir Al-Qur\'an', 'kitab' => 'Tafsir Al-Jalalain', 'penulis' => 'Jalaluddin Al-Mahalli & As-Suyuthi'],
                ['mapel' => 'Ilmu Hadits (Mustholah)', 'kitab' => 'Al-Manzhumah Al-Baiquniyyah', 'penulis' => 'Syaikh Thaha Al-Baiquni'],
            ],
        ];

        return Inertia::render('Guru/Madin/Index', [
            'madinKelasList'   => $madinKelasList,
            'links'            => $links,
            'kurikulumStandar' => $kurikulumStandar,
        ]);
    }

    /**
     * Tambah Tautan Pelajaran Madin
     */
    public function storeLink(Request $request)
    {
        $validated = $request->validate([
            'madin_kelas_id' => 'required|exists:madin_kelas,id',
            'mapel'          => 'required|string|max:255',
            'link'           => 'nullable|url|max:2048',
            'link_uts'       => 'nullable|url|max:2048',
            'uts_mulai'      => 'nullable|date',
            'uts_tutup'      => 'nullable|date',
            'link_uas'       => 'nullable|url|max:2048',
            'uas_mulai'      => 'nullable|date',
            'uas_tutup'      => 'nullable|date',
            'hari_belajar'   => 'nullable|string|max:50',
            'jam_mulai'      => 'nullable|string|max:10',
            'jam_selesai'    => 'nullable|string|max:10',
            'keterangan'     => 'nullable|string',
        ]);

        $validated['guru_id'] = auth()->id();
        $validated['kategori'] = 'madin';

        ClassroomLink::create($validated);

        return back()->with('success', 'Tautan pelajaran Madin berhasil ditambahkan.');
    }

    /**
     * Perbarui Tautan Pelajaran Madin
     */
    public function updateLink(Request $request, ClassroomLink $link)
    {
        $validated = $request->validate([
            'madin_kelas_id' => 'required|exists:madin_kelas,id',
            'mapel'          => 'required|string|max:255',
            'link'           => 'nullable|url|max:2048',
            'link_uts'       => 'nullable|url|max:2048',
            'uts_mulai'      => 'nullable|date',
            'uts_tutup'      => 'nullable|date',
            'link_uas'       => 'nullable|url|max:2048',
            'uas_mulai'      => 'nullable|date',
            'uas_tutup'      => 'nullable|date',
            'hari_belajar'   => 'nullable|string|max:50',
            'jam_mulai'      => 'nullable|string|max:10',
            'jam_selesai'    => 'nullable|string|max:10',
            'keterangan'     => 'nullable|string',
        ]);

        $link->update($validated);

        return back()->with('success', 'Tautan pelajaran Madin berhasil diperbarui.');
    }

    /**
     * Hapus Tautan Pelajaran Madin
     */
    public function destroyLink(ClassroomLink $link)
    {
        $link->delete();

        return back()->with('success', 'Tautan pelajaran Madin berhasil dihapus.');
    }
}
