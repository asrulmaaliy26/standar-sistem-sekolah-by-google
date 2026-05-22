<?php

namespace Database\Seeders;

use App\Models\Jabatan;
use Illuminate\Database\Seeder;

class JabatanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jabatan = [
            ['name' => 'kepala sekolah', 'description' => 'Pimpinan tertinggi sekolah'],
            ['name' => 'wali kelas', 'description' => 'Penanggung jawab kelas tertentu'],
            ['name' => 'kurikulum', 'description' => 'Pengelola kurikulum dan pembelajaran'],
        ];

        foreach ($jabatan as $item) {
            Jabatan::firstOrCreate(['name' => $item['name']], $item);
        }
    }
}
