<?php

namespace App\Services;

use App\Models\KrsMatakuliah;
use App\Models\KrsDosen;
use App\Models\KrsRuang;
use App\Models\KrsWaktu;
use App\Models\KrsJadwalPlot;
use Illuminate\Support\Facades\DB;
use Exception;

class KrsMasterDataService
{
    /**
     * Peta tipe data master ke model Eloquent yang bersesuaian.
     */
    private array $typeModelMap = [
        'matakuliah' => KrsMatakuliah::class,
        'dosen'      => KrsDosen::class,
        'ruang'      => KrsRuang::class,
        'waktu'      => KrsWaktu::class,
    ];

    /**
     * Menambahkan data master secara manual.
     */
    public function storeMasterData(string $type, int $periodId, array $data): void
    {
        if ($type === 'matakuliah') {
            $mk = KrsMatakuliah::create([
                'krs_period_id'    => $periodId,
                'kode_mk'          => $data['kode_mp'],
                'nama_mk'          => $data['nama_mp'],
                'kelas'            => $data['kelas'],
                'sks'              => $data['pj'],
                'jenis_ruang'      => $data['jenis_ruang'] ?? null,
            ]);
            KrsJadwalPlot::create([
                'krs_period_id'     => $periodId,
                'krs_matakuliah_id' => $mk->id,
                'is_conflict'       => false,
                'conflict_message'  => null,
            ]);
        } elseif ($type === 'dosen') {
            KrsDosen::create([
                'krs_period_id' => $periodId,
                'nama_dosen'    => $data['nama_pendidik'],
                'kode_mk'       => $data['kode_mp'],
                'prioritas'     => null,
                'max_sks'       => $data['max_pj'] ?? null,
            ]);
        } elseif ($type === 'ruang') {
            KrsRuang::create([
                'krs_period_id' => $periodId,
                'kode_ruang'    => strtoupper(str_replace(' ', '_', $data['nama_ruang'])),
                'nama_ruang'    => $data['nama_ruang'],
                'kapasitas'     => $data['kapasitas'],
                'jenis_ruang'   => null,
            ]);
        }
    }

    /**
     * Menghapus seluruh data master berdasarkan tipe.
     */
    public function deleteMasterDataByType(string $type, int $periodId): void
    {
        match ($type) {
            'matakuliah' => KrsMatakuliah::where('krs_period_id', $periodId)->delete(),
            'dosen'      => KrsDosen::where('krs_period_id', $periodId)->delete(),
            'ruang'      => $this->deleteRuangAndAddDaring($periodId),
            'waktu'      => $this->deleteWaktuAndClearPlots($periodId),
        };
    }

    /**
     * Hapus semua ruang lama lalu tambahkan ruang DARING secara otomatis.
     */
    private function deleteRuangAndAddDaring(int $periodId): void
    {
        KrsRuang::where('krs_period_id', $periodId)->delete();
        KrsRuang::create([
            'krs_period_id' => $periodId,
            'kode_ruang'    => 'DARING',
            'nama_ruang'    => 'DARING',
            'kapasitas'     => 9999,
            'jenis_ruang'   => 'Daring',
        ]);
    }

    /**
     * Hapus semua waktu lama dan kosongkan referensi waktu dari tabel plots.
     */
    private function deleteWaktuAndClearPlots(int $periodId): void
    {
        KrsWaktu::where('krs_period_id', $periodId)->delete();
        KrsJadwalPlot::where('krs_period_id', $periodId)->update(['krs_waktu_ids' => null]);
    }

    /**
     * Menghapus satu record master data berdasarkan ID.
     */
    public function destroySingleMasterData(string $type, int $id): void
    {
        if (!array_key_exists($type, $this->typeModelMap)) {
            throw new Exception("Type not supported.");
        }

        if ($type === 'waktu') {
            $waktu = KrsWaktu::findOrFail($id);
            // Bersihkan referensi waktu dari plots agar tidak ada orphaned JSON ID
            KrsJadwalPlot::where('krs_period_id', $waktu->krs_period_id)
                ->update(['krs_waktu_ids' => null]);
            $waktu->delete();
        } else {
            $this->typeModelMap[$type]::findOrFail($id)->delete();
        }
    }

    /**
     * Generate Waktu
     */
    public function generateWaktu(int $periodId, string $jamMulaiStr, int $durasiSks, int $jumlahSlot, bool $isIstirahat, ?string $istirahatMulaiStr, ?string $istirahatSelesaiStr): void
    {
        DB::transaction(function () use ($periodId, $jamMulaiStr, $durasiSks, $jumlahSlot, $isIstirahat, $istirahatMulaiStr, $istirahatSelesaiStr) {
            // Hapus waktu lama dan kosongkan referensi dari tabel plots
            KrsWaktu::where('krs_period_id', $periodId)->delete();
            KrsJadwalPlot::where('krs_period_id', $periodId)->update(['krs_waktu_ids' => null]);

            $currentTime      = \Carbon\Carbon::createFromFormat('H:i', $jamMulaiStr);
            $istirahatMulai   = $isIstirahat && $istirahatMulaiStr
                ? \Carbon\Carbon::createFromFormat('H:i', $istirahatMulaiStr)
                : null;
            $istirahatSelesai = $isIstirahat && $istirahatSelesaiStr
                ? \Carbon\Carbon::createFromFormat('H:i', $istirahatSelesaiStr)
                : null;

            for ($i = 0; $i < $jumlahSlot; $i++) {
                // Lewati slot yang overlap dengan jam istirahat
                if ($istirahatMulai && $istirahatSelesai) {
                    if (
                        $currentTime->format('H:i') >= $istirahatMulai->format('H:i') &&
                        $currentTime->format('H:i') < $istirahatSelesai->format('H:i')
                    ) {
                        $currentTime = $istirahatSelesai->copy();
                    }
                }

                $jamMulai = $currentTime->format('H:i');
                $currentTime->addMinutes($durasiSks);
                $jamSelesai = $currentTime->format('H:i');

                KrsWaktu::create([
                    'krs_period_id' => $periodId,
                    'jam_mulai'     => $jamMulai,
                    'jam_selesai'   => $jamSelesai,
                    'durasi_menit'  => $durasiSks,
                ]);
            }
        });
    }

    /**
     * Update max sks untuk semua dosen di suatu periode.
     */
    public function autoCalculateMaxSks(int $periodId): void
    {
        $mks      = KrsMatakuliah::where('krs_period_id', $periodId)->get();
        $mkGroups = $mks->groupBy('kode_mk');

        foreach ($mkGroups as $kodeMk => $classes) {
            $totalClasses = $classes->count();
            // Asumsikan semua kelas dengan kode_mk sama memiliki SKS yang sama
            $sksPerClass  = $classes->first()->sks;

            $dosens = KrsDosen::where('krs_period_id', $periodId)
                ->where('kode_mk', $kodeMk)
                ->get();

            if ($dosens->count() === 0) continue;

            // Membagi rata ke SEMUA dosen (menimpa batas manual sebelumnya)
            // agar dosen yang baru ditambahkan juga mendapat jatah kuota
            $avgClasses = (int) ceil($totalClasses / $dosens->count());
            $avgSks     = $avgClasses * $sksPerClass;

            foreach ($dosens as $d) {
                $d->max_sks = $avgSks;
                $d->save();
            }
        }
    }
}
