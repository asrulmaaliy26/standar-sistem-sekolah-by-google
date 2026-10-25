<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Jenjang;
use App\Models\Rombel;
use App\Models\Kamar;
use App\Models\MadinKelas;
use App\Models\User;

class SmartPesantrenSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::whereHas('roles', fn($q) => $q->where('name', 'superadmin'))->first()
            ?? User::first();

        // 1. Jenjang Pendidikan
        $jenjangs = [
            'TK / RA Al-Hidayah' => ['lokasi' => 'Kampus 1', 'deskripsi' => 'Pendidikan Usia Dini Al-Qur\'an'],
            'MI Al-Hidayah'      => ['lokasi' => 'Kampus 1', 'deskripsi' => 'Madrasah Ibtidaiyah Terpadu'],
            'MTs Al-Hidayah'     => ['lokasi' => 'Kampus 2', 'deskripsi' => 'Madrasah Tsanawiyah Pesantren'],
            'MA Al-Hidayah'      => ['lokasi' => 'Kampus 2', 'deskripsi' => 'Madrasah Aliyah Keagamaan & Sains'],
        ];

        $jenjangModels = [];
        foreach ($jenjangs as $nama => $data) {
            $jenjangModels[$nama] = Jenjang::firstOrCreate(
                ['nama' => $nama],
                $data
            );
        }

        // 2. Rombongan Belajar (Rombels)
        $rombelsData = [
            'Kelompok A (RA)'   => 'TK / RA Al-Hidayah',
            'Kelompok B (RA)'   => 'TK / RA Al-Hidayah',
            'Kelas 1 (MI)'      => 'MI Al-Hidayah',
            'Kelas 2 (MI)'      => 'MI Al-Hidayah',
            'Kelas 3 (MI)'      => 'MI Al-Hidayah',
            'Kelas 4 (MI)'      => 'MI Al-Hidayah',
            'Kelas 5 (MI)'      => 'MI Al-Hidayah',
            'Kelas 6 (MI)'      => 'MI Al-Hidayah',
            'Kelas VII-A (MTs)' => 'MTs Al-Hidayah',
            'Kelas VII-B (MTs)' => 'MTs Al-Hidayah',
            'Kelas VIII-A (MTs)'=> 'MTs Al-Hidayah',
            'Kelas VIII-B (MTs)'=> 'MTs Al-Hidayah',
            'Kelas IX-A (MTs)'  => 'MTs Al-Hidayah',
            'Kelas IX-B (MTs)'  => 'MTs Al-Hidayah',
            'Kelas X-IPA (MA)'  => 'MA Al-Hidayah',
            'Kelas X-IPS (MA)'  => 'MA Al-Hidayah',
            'Kelas XI-IPA (MA)' => 'MA Al-Hidayah',
            'Kelas XI-IPS (MA)' => 'MA Al-Hidayah',
            'Kelas XII-IPA (MA)'=> 'MA Al-Hidayah',
            'Kelas XII-IPS (MA)'=> 'MA Al-Hidayah',
        ];

        foreach ($rombelsData as $rombelName => $jenjangKey) {
            Rombel::firstOrCreate(
                ['name' => $rombelName],
                [
                    'jenjang_id' => $jenjangModels[$jenjangKey]->id ?? null,
                    'lokasi'     => 'Gedung Utama',
                ]
            );
        }

        // 3. Kamar Asrama Pondok (Pondok Pillar)
        $kamarsData = [
            [
                'nama_kamar' => 'Kamar Abu Bakar 01',
                'gedung'     => 'Asrama Putra Lt. 1',
                'kapasitas'  => 10,
                'gender'     => 'L',
                'pembina_id' => $admin?->id,
                'keterangan' => 'Kamar tahfidz putra tingkat awal',
            ],
            [
                'nama_kamar' => 'Kamar Umar bin Khattab',
                'gedung'     => 'Asrama Putra Lt. 2',
                'kapasitas'  => 10,
                'gender'     => 'L',
                'pembina_id' => $admin?->id,
                'keterangan' => 'Kamar santri putra tingkat menengah',
            ],
            [
                'nama_kamar' => 'Kamar Usman bin Affan',
                'gedung'     => 'Asrama Putra Lt. 2',
                'kapasitas'  => 8,
                'gender'     => 'L',
                'pembina_id' => $admin?->id,
                'keterangan' => 'Kamar santri putra tingkat atas',
            ],
            [
                'nama_kamar' => 'Kamar Khadijah 01',
                'gedung'     => 'Asrama Putri Lt. 1',
                'kapasitas'  => 10,
                'gender'     => 'P',
                'pembina_id' => $admin?->id,
                'keterangan' => 'Kamar santri putri tingkat awal',
            ],
            [
                'nama_kamar' => 'Kamar Aisyah 02',
                'gedung'     => 'Asrama Putri Lt. 2',
                'kapasitas'  => 10,
                'gender'     => 'P',
                'pembina_id' => $admin?->id,
                'keterangan' => 'Kamar santri putri tingkat menengah',
            ],
            [
                'nama_kamar' => 'Kamar Fatimah Az-Zahra',
                'gedung'     => 'Asrama Putri Lt. 2',
                'kapasitas'  => 8,
                'gender'     => 'P',
                'pembina_id' => $admin?->id,
                'keterangan' => 'Kamar santri putri tahfidz intensif',
            ],
        ];

        foreach ($kamarsData as $k) {
            Kamar::firstOrCreate(
                ['nama_kamar' => $k['nama_kamar']],
                $k
            );
        }

        // 4. Kelas Madrasah Diniyah (Madin Pillar)
        $madinData = [
            [
                'nama_kelas'    => 'Madin Ula 1',
                'tingkat'       => 'Ula',
                'wali_kelas_id' => $admin?->id,
                'deskripsi'     => 'Dasar Tajwid, Pegon, dan Baca Tulis Al-Qur\'an',
            ],
            [
                'nama_kelas'    => 'Madin Ula 2',
                'tingkat'       => 'Ula',
                'wali_kelas_id' => $admin?->id,
                'deskripsi'     => 'Kitab Safinatun Naja, Aqidatul Awam, dan Akhlaqul Banin',
            ],
            [
                'nama_kelas'    => 'Madin Wustho 1',
                'tingkat'       => 'Wustho',
                'wali_kelas_id' => $admin?->id,
                'deskripsi'     => 'Kitab Al-Jurumiyyah, Matan At-Taqrib, dan Taisirul Khollaq',
            ],
            [
                'nama_kelas'    => 'Madin Wustho 2',
                'tingkat'       => 'Wustho',
                'wali_kelas_id' => $admin?->id,
                'deskripsi'     => 'Kitab Al-Imrithi, Fathul Qorib Al-Mujib, dan Hadits Arbain',
            ],
            [
                'nama_kelas'    => 'Madin Ulya',
                'tingkat'       => 'Ulya',
                'wali_kelas_id' => $admin?->id,
                'deskripsi'     => 'Kajian Lanjutan Alfiyyah Ibnu Malik, Fathul Mu\'in, dan Tafsir Jalalain',
            ],
        ];

        foreach ($madinData as $m) {
            MadinKelas::firstOrCreate(
                ['nama_kelas' => $m['nama_kelas']],
                $m
            );
        }
    }
}
