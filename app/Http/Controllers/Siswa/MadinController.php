<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\ClassroomLink;
use App\Models\MadinKelas;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MadinController extends Controller
{
    /**
     * Tampilan Menu Madrasah Diniyah (Madin) untuk Santri / Murid
     */
    public function index()
    {
        $user = auth()->user();

        // 1. Data Kelas Madin Santri
        $madinKelas = null;
        $temanSekelas = collect();
        $links = collect();
        $examSessions = collect();

        if ($user->madin_kelas_id) {
            $madinKelas = MadinKelas::with('waliKelas:id,name,email')->find($user->madin_kelas_id);

            if ($madinKelas) {
                // Teman sekelas Madin (lintas kelas formal)
                $temanSekelas = User::where('madin_kelas_id', $madinKelas->id)
                    ->where('id', '!=', $user->id)
                    ->with('rombel:id,name', 'kamar:id,nama_kamar')
                    ->get(['id', 'name', 'email', 'rombel_id', 'kamar_id', 'jenis_kelamin']);

                // Tautan Google Classroom & Jadwal Diniyah
                $links = ClassroomLink::with('guru:id,name')
                    ->where('kategori', 'madin')
                    ->where('madin_kelas_id', $madinKelas->id)
                    ->latest()
                    ->get();

                if ($links->isNotEmpty()) {
                    $examSessions = \App\Models\ExamSession::where('user_id', $user->id)
                        ->whereIn('classroom_link_id', $links->pluck('id'))
                        ->get(['classroom_link_id', 'exam_type', 'status']);
                }
            }
        }

        // 2. Daftar Kurikulum Standar Madin Pesantren Al-Hidayah
        $kurikulumStandar = [
            'Ula' => [
                ['mapel' => 'Fiqih', 'kitab' => 'Safinatun Naja / Mabadiul Fiqhiyyah', 'penulis' => 'Syaikh Salim bin Samir Al-Hadhrami'],
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

        return Inertia::render('Siswa/Madin/Index', [
            'madinKelas'       => $madinKelas,
            'temanSekelas'     => $temanSekelas,
            'links'            => $links,
            'examSessions'     => $examSessions,
            'kurikulumStandar' => $kurikulumStandar,
        ]);
    }
}
