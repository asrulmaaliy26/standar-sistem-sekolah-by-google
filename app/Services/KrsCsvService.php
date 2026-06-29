<?php

namespace App\Services;

use App\Models\KrsMatakuliah;
use App\Models\KrsDosen;
use App\Models\KrsRuang;
use App\Models\KrsWaktu;
use App\Models\KrsJadwalPlot;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Exception;

class KrsCsvService
{
    /**
     * Header kolom CSV yang diharapkan untuk setiap tipe master data.
     * Komentar pada kolom header dan logika import harus selalu sinkron.
     *
     * Format dosen: nama_pendidik, kode_mp, kelas, prioritas, max_pj
     * Format ruang: kode_ruang, nama_ruang, kapasitas, jenis_ruang
     * Format waktu: jam_mulai, jam_selesai
     * Format matakuliah: kode_mp, nama_mp, kelas, pj, jumlah_santri
     */
    private array $typeCsvHeaders = [
        'matakuliah'     => ['kode_mp', 'nama_mp', 'kelas', 'pj', 'jumlah_santri'],
        'dosen'          => ['nama_pendidik', 'kode_mp', 'kelas', 'prioritas', 'max_pj'],
        'ruang'          => ['kode_ruang', 'nama_ruang', 'kapasitas', 'jenis_ruang'],
        'waktu'          => ['jam_mulai', 'jam_selesai'],
        'import_lengkap' => ['Kode MP', 'Nama MP', 'Kelas', 'PJ', 'Pendidik Utama', 'Pendidik Pendamping', 'Jenis Ruang'],
    ];

    /**
     * Baris contoh data untuk setiap tipe template.
     */
    private array $typeCsvExamples = [
        'matakuliah' => [
            ['20000011A01', 'PANCASILA 2', 'A', '2', '30'],
            ['20000011A01', 'PANCASILA 2', 'B', '2', '28'],
            ['22040111D01', 'PSIKOLOGI DASAR 6', 'A', '6', '25'],
        ],
        'dosen' => [
            ['Ali Syahidin Mubarok', '20000011A01', 'A', '1', ''],
            ['Taufik', '20000011A01', 'A', '2', ''],
            ['Rika Fuaturosida', '22040111D01', 'A', '1', ''],
        ],
        'ruang' => [
            ['R101', 'Ruang 101', '40', 'besar'],
            ['R102', 'Ruang 102', '30', 'kecil'],
            ['LAB1', 'Lab Komputer 1', '20', 'kecil'],
        ],
        'waktu' => [
            ['06:30', '08:10'],
            ['08:10', '09:50'],
            ['09:50', '11:30'],
        ],
        'import_lengkap' => [
            ['20000011A01', 'PANCASILA 2', 'A', '2', 'Ali Syahidin Mubarok', 'Taufik', 'kecil'],
            ['20000011A01', 'PANCASILA 2', 'B', '2', 'Ali Syahidin Mubarok', 'Ikhsan', 'kecil'],
            ['20000011A01', 'PANCASILA 2', 'C', '2', 'Taufik', '-', 'kecil'],
            ['22040111D01', 'PSIKOLOGI DASAR 6', 'A', '6', 'Yusuf Ratu Agung', '-', 'besar'],
            ['22040111D01', 'PSIKOLOGI DASAR 6', 'B', '6', 'Rika Fuaturosida', '-', 'besar'],
        ],
    ];

    /**
     * Download template CSV sesuai tipe master data.
     * Mengembalikan array [header, ...contoh_baris].
     */
    public function getTemplateHeaders(string $type): array
    {
        if (!array_key_exists($type, $this->typeCsvHeaders)) {
            throw new Exception("Type not supported for template download.");
        }

        return $this->typeCsvHeaders[$type];
    }

    public function getTemplateRows(string $type): array
    {
        return $this->typeCsvExamples[$type] ?? [];
    }

    /**
     * Import data master dari file CSV atau Excel.
     */
    public function importCsv(UploadedFile $file, string $type, int $periodId, KrsMasterDataService $masterDataService): void
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $rows = $this->parseUploadedFile($file, $extension);

        DB::beginTransaction();
        try {
            $masterDataService->deleteMasterDataByType($type, $periodId);

            foreach ($rows as $data) {
                if (empty(array_filter($data))) continue; // lewati baris kosong
                $this->insertMasterDataRow($type, $periodId, $data);
            }

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Export data jadwal plotting ke format CSV.
     */
    public function exportCsvData(int $periodId): array
    {
        $plots    = KrsJadwalPlot::with(['matakuliah', 'dosen', 'dosenKedua', 'ruang'])
            ->where('krs_period_id', $periodId)
            ->get();
        $waktus   = KrsWaktu::where('krs_period_id', $periodId)->get();

        $rows = [];
        $rows[] = ['Kode MP', 'Nama MP', 'Kelas', 'PJ', 'Pendidik Utama', 'Pendidik Pendamping', 'Ruang', 'Hari', 'Jam', 'Status'];

        foreach ($plots as $plot) {
            $waktuStr = '';
            $hariStr  = $plot->hari ?? '-';

            if ($plot->krs_waktu_ids) {
                $plotWaktus = collect($plot->krs_waktu_ids)
                    ->map(fn($id) => $waktus->firstWhere('id', $id))
                    ->filter()
                    ->values();

                if ($plotWaktus->count() > 0) {
                    $waktuStr = $plotWaktus->first()->jam_mulai . ' - ' . $plotWaktus->last()->jam_selesai;
                }
            }

            $rows[] = [
                $plot->matakuliah?->kode_mk,
                $plot->matakuliah?->nama_mk,
                $plot->matakuliah?->kelas,
                $plot->matakuliah?->sks,
                $plot->dosen?->nama_dosen ?? '-',
                $plot->dosenKedua?->nama_dosen ?? '-',
                $plot->ruang?->nama_ruang ?? '-',
                $hariStr,
                $waktuStr,
                $plot->is_conflict ? 'Konflik: ' . $plot->conflict_message : 'Aman',
            ];
        }

        return $rows;
    }

    /**
     * Parse file upload (CSV/TXT atau Excel) menjadi array baris data.
     */
    private function parseUploadedFile(UploadedFile $file, string $extension): array
    {
        if (in_array($extension, ['csv', 'txt'])) {
            $handle = fopen($file->getRealPath(), 'r');
            fgetcsv($handle, 1000, ','); // lewati baris header
            $rows = [];
            while (($data = fgetcsv($handle, 1000, ',')) !== false) {
                $rows[] = $data;
            }
            fclose($handle);
            return $rows;
        }

        // Excel: gunakan Maatwebsite Excel
        $import = new class implements \Maatwebsite\Excel\Concerns\ToArray {
            public array $data = [];
            public function array(array $array): void
            {
                $this->data = $array;
            }
        };
        \Maatwebsite\Excel\Facades\Excel::import($import, $file);
        $rows = $import->data[0] ?? [];
        if (count($rows) > 0) array_shift($rows); // hapus baris header
        return $rows;
    }

    /**
     * Insert satu baris data master ke database sesuai tipenya.
     * Urutan kolom harus sama persis dengan $typeCsvHeaders.
     */
    private function insertMasterDataRow(string $type, int $periodId, array $data): void
    {
        if ($type === 'matakuliah') {
            $mk = KrsMatakuliah::create([
                'krs_period_id'    => $periodId,
                'kode_mk'          => $data[0] ?? '',
                'nama_mk'          => $data[1] ?? '',
                'kelas'            => $data[2] ?? '',
                'sks'              => (int) ($data[3] ?? 0),
                'jenis_ruang'      => $data[4] ?? null,
            ]);
            
            $dosen = KrsDosen::where('krs_period_id', $periodId)
                ->where('kode_mk', $mk->kode_mk)
                ->where('kelas', $mk->kelas)
                ->first();

            KrsJadwalPlot::create([
                'krs_period_id'     => $periodId,
                'krs_matakuliah_id' => $mk->id,
                'krs_dosen_id'      => $dosen ? $dosen->id : null,
                'is_conflict'       => false,
                'conflict_message'  => null,
            ]);
            return;
        }

        if ($type === 'dosen') {
            $dosen = KrsDosen::create([
                'krs_period_id' => $periodId,
                'nama_dosen'    => $data[0] ?? '',      // kolom 0: nama_dosen
                'kode_mk'       => $data[1] ?? '',      // kolom 1: kode_mk
                'kelas'         => $data[2] ?? '',      // kolom 2: kelas
                'prioritas'     => isset($data[3]) ? (int) $data[3] : null, // kolom 3: prioritas
                'max_sks'       => isset($data[4]) ? (int) $data[4] : null, // kolom 4: max_sks
            ]);

            $mk = KrsMatakuliah::where('krs_period_id', $periodId)
                ->where('kode_mk', $dosen->kode_mk)
                ->where('kelas', $dosen->kelas)
                ->first();
                
            if ($mk) {
                KrsJadwalPlot::where('krs_period_id', $periodId)
                    ->where('krs_matakuliah_id', $mk->id)
                    ->whereNull('krs_dosen_id')
                    ->update(['krs_dosen_id' => $dosen->id]);
            }
            return;
        }
        if ($type === 'import_lengkap') {
            // Kolom: Kode MP (0), Nama MP (1), Kelas (2), PJ (3), Pendidik Utama (4), Pendidik Pendamping (5), Jenis Ruang (6)
            $kodeMk = $data[0] ?? '';
            $kelas = $data[2] ?? '';

            if (empty($kodeMk)) return;

            // 1. Matakuliah
            $mk = KrsMatakuliah::firstOrCreate(
                [
                    'krs_period_id' => $periodId,
                    'kode_mk'       => $kodeMk,
                    'kelas'         => $kelas,
                ],
                [
                    'nama_mk'     => $data[1] ?? '',
                    'sks'         => (int) ($data[3] ?? 0),
                    'jenis_ruang' => $data[6] ?? null,
                ]
            );

            // 2. Dosen Utama
            $dosenId = null;
            $namaDosenUtama = trim($data[4] ?? '');
            if (!empty($namaDosenUtama) && $namaDosenUtama !== '-') {
                $dosen = KrsDosen::firstOrCreate(
                    [
                        'krs_period_id' => $periodId,
                        'kode_mk'       => $kodeMk,
                        'kelas'         => $kelas,
                        'nama_dosen'    => $namaDosenUtama,
                    ],
                    [
                        'prioritas' => null,
                        'max_sks'   => null,
                    ]
                );
                $dosenId = $dosen->id;
            }

            // 3. Dosen Pendamping
            $dosenKeduaId = null;
            $namaDosenPendamping = trim($data[5] ?? '');
            if (!empty($namaDosenPendamping) && $namaDosenPendamping !== '-') {
                $dosenKedua = KrsDosen::firstOrCreate(
                    [
                        'krs_period_id' => $periodId,
                        'kode_mk'       => $kodeMk,
                        'kelas'         => $kelas,
                        'nama_dosen'    => $namaDosenPendamping,
                    ],
                    [
                        'prioritas' => null,
                        'max_sks'   => null,
                    ]
                );
                $dosenKeduaId = $dosenKedua->id;
            }

            // 4. Jadwal Plot
            $plot = KrsJadwalPlot::firstOrCreate(
                [
                    'krs_period_id'     => $periodId,
                    'krs_matakuliah_id' => $mk->id,
                ],
                [
                    'is_conflict'      => false,
                    'conflict_message' => null,
                ]
            );

            $plot->krs_dosen_id = $dosenId ?? $plot->krs_dosen_id;
            $plot->krs_dosen_kedua_id = $dosenKeduaId ?? $plot->krs_dosen_kedua_id;
            $plot->save();

            return;
        }

        match ($type) {
            'ruang' => KrsRuang::create([
                'krs_period_id' => $periodId,
                'kode_ruang'    => $data[0] ?? '',
                'nama_ruang'    => $data[1] ?? '',
                'kapasitas'     => $data[2] ?? null,
                'jenis_ruang'   => $data[3] ?? null,
            ]),

            'waktu' => $this->insertWaktuRow($periodId, $data),

            default => null,
        };
    }

    /**
     * Parse dan insert satu baris data waktu.
     * Format kolom: jam_mulai (e.g. 06.30 atau 06:30), jam_selesai
     */
    private function insertWaktuRow(int $periodId, array $data): void
    {
        $rawMulai   = str_replace('.', ':', trim($data[0] ?? '00:00'));
        $rawSelesai = str_replace('.', ':', trim($data[1] ?? '00:00'));

        // Lewati baris yang merupakan header
        if (strtolower($rawMulai) === 'mulai') return;

        try {
            $mulai   = \Carbon\Carbon::createFromFormat('H:i', $rawMulai);
            $selesai = \Carbon\Carbon::createFromFormat('H:i', $rawSelesai);
        } catch (\Exception $e) {
            return; // Lewati baris dengan format waktu tidak valid
        }

        KrsWaktu::create([
            'krs_period_id' => $periodId,
            'jam_mulai'     => $mulai->format('H:i:s'),
            'jam_selesai'   => $selesai->format('H:i:s'),
            'durasi_menit'  => $mulai->diffInMinutes($selesai),
        ]);
    }
}
