<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\KrsPeriod;
use App\Models\KrsMatakuliah;
use App\Models\KrsDosen;
use App\Models\KrsRuang;
use App\Models\KrsWaktu;
use App\Models\KrsJadwalPlot;
use App\Services\KrsPlottingService;
use Illuminate\Support\Facades\DB;

class KrsSchedulingController extends Controller
{
    /**
     * Peta tipe data master ke model Eloquent yang bersesuaian.
     * Digunakan untuk menghindari duplikasi pola if-elseif pada banyak method.
     */
    private array $typeModelMap = [
        'matakuliah' => KrsMatakuliah::class,
        'dosen'      => KrsDosen::class,
        'ruang'      => KrsRuang::class,
        'waktu'      => KrsWaktu::class,
    ];

    /**
     * Header kolom CSV yang diharapkan untuk setiap tipe master data.
     * Komentar pada kolom header dan logika import harus selalu sinkron.
     *
     * Format dosen: nama_pendidik, kode_mp, prioritas, max_pj
     * Format ruang: kode_ruang, nama_ruang, kapasitas, jenis_ruang
     * Format waktu: jam_mulai, jam_selesai
     * Format matakuliah: kode_mp, nama_mp, kelas, pj, jumlah_santri
     */
    private array $typeCsvHeaders = [
        'matakuliah' => ['kode_mp', 'nama_mp', 'kelas', 'pj', 'jumlah_santri'],
        'dosen'      => ['nama_pendidik', 'kode_mp', 'prioritas', 'max_pj'],
        'ruang'      => ['kode_ruang', 'nama_ruang', 'kapasitas', 'jenis_ruang'],
        'waktu'      => ['jam_mulai', 'jam_selesai'],
    ];

    public function index(Request $request)
    {
        $periods = KrsPeriod::orderBy('created_at', 'desc')->get();
        $activePeriodId = $request->query('period_id', $periods->where('is_active', true)->first()?->id ?? ($periods->first()?->id));

        $matakuliahs = [];
        $plots = [];
        $dosens = [];
        $ruangs = [];
        $waktus = [];

        if ($activePeriodId) {
            $matakuliahs = KrsMatakuliah::where('krs_period_id', $activePeriodId)->get();
            $dosens = KrsDosen::where('krs_period_id', $activePeriodId)->get();
            $ruangs = KrsRuang::where('krs_period_id', $activePeriodId)->get();
            $waktus = KrsWaktu::where('krs_period_id', $activePeriodId)->get();

            $plots = KrsJadwalPlot::with(['matakuliah', 'dosen', 'ruang'])
                ->where('krs_period_id', $activePeriodId)
                ->get();

            // Hitung conflict group dinamis untuk color coding di UI
            $roomUsage = [];
            $dosenUsage = [];
            foreach ($plots as $plot) {
                if (!$plot->hari || empty($plot->krs_waktu_ids)) continue;
                foreach ($plot->krs_waktu_ids as $wId) {
                    if ($plot->krs_ruang_id) $roomUsage[$plot->hari][$plot->krs_ruang_id][$wId][] = $plot->id;
                    if ($plot->krs_dosen_id) $dosenUsage[$plot->hari][$plot->krs_dosen_id][$wId][] = $plot->id;
                }
            }

            $conflictGroups = [];
            $groupId = 1;

            $plots = $plots->map(function ($plot) use ($waktus, $roomUsage, $dosenUsage, &$conflictGroups, &$groupId) {
                $plotWaktus = [];
                if (!empty($plot->krs_waktu_ids)) {
                    $plotWaktus = collect($plot->krs_waktu_ids)->map(fn($id) => $waktus->firstWhere('id', $id))->filter()->values();
                }
                $plot->waktu_details = $plotWaktus;

                $myGroups = [];
                if ($plot->hari && !empty($plot->krs_waktu_ids)) {
                    foreach ($plot->krs_waktu_ids as $wId) {
                        if ($plot->krs_ruang_id) {
                            $users = $roomUsage[$plot->hari][$plot->krs_ruang_id][$wId] ?? [];
                            if (count($users) > 1) {
                                $key = "R_{$plot->hari}_{$plot->krs_ruang_id}_{$wId}";
                                if (!isset($conflictGroups[$key])) $conflictGroups[$key] = $groupId++;
                                $myGroups[] = $conflictGroups[$key];
                            }
                        }
                        if ($plot->krs_dosen_id) {
                            $users = $dosenUsage[$plot->hari][$plot->krs_dosen_id][$wId] ?? [];
                            if (count($users) > 1) {
                                $key = "D_{$plot->hari}_{$plot->krs_dosen_id}_{$wId}";
                                if (!isset($conflictGroups[$key])) $conflictGroups[$key] = $groupId++;
                                $myGroups[] = $conflictGroups[$key];
                            }
                        }
                    }
                }

                $plot->conflict_group_id = !empty($myGroups) ? min($myGroups) : null;
                return $plot;
            });
        }

        return Inertia::render('Admin/Krs/Index', [
            'periods'       => $periods,
            'activePeriodId'=> (int) $activePeriodId,
            'plots'         => $plots,
            'matakuliahs'   => $matakuliahs,
            'dosens'        => $dosens,
            'ruangs'        => $ruangs,
            'waktus'        => $waktus,
        ]);
    }

    public function storePeriod(Request $request)
    {
        $request->validate([
            'tahun_akademik' => 'required|string',
            'semester'       => 'required|in:Ganjil,Genap',
        ]);

        DB::transaction(function () use ($request) {
            KrsPeriod::query()->update(['is_active' => false]);
            KrsPeriod::create([
                'tahun_akademik' => $request->tahun_akademik,
                'semester'       => $request->semester,
                'is_active'      => true,
            ]);
        });

        return redirect()->back()->with('success', 'Periode berhasil ditambahkan.');
    }

    /**
     * Download template CSV sesuai tipe master data.
     * Header kolom template ini harus selalu sinkron dengan logika importCsv().
     */
    public function downloadTemplate(string $type)
    {
        if (!array_key_exists($type, $this->typeCsvHeaders)) {
            abort(404);
        }

        $headers = $this->typeCsvHeaders[$type];

        $callback = function () use ($headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            fclose($file);
        };

        return response()->streamDownload($callback, "template_{$type}.csv", [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * Import data master dari file CSV atau Excel.
     *
     * Urutan kolom yang diharapkan per tipe:
     * - matakuliah : kode_mk, nama_mk, kelas, sks, jumlah_mahasiswa
     * - dosen      : nama_dosen, kode_mk, prioritas, max_sks
     * - ruang      : kode_ruang, nama_ruang, kapasitas, jenis_ruang
     * - waktu      : jam_mulai, jam_selesai
     */
    public function importCsv(Request $request)
    {
        $request->validate([
            'type'      => 'required|in:matakuliah,dosen,ruang,waktu',
            'file'      => 'required|file|mimes:csv,txt,xlsx,xls',
            'period_id' => 'required|exists:krs_periods,id',
        ]);

        $file      = $request->file('file');
        $type      = $request->type;
        $periodId  = $request->period_id;
        $extension = strtolower($file->getClientOriginalExtension());

        $rows = $this->parseUploadedFile($file, $extension);

        DB::beginTransaction();
        try {
            $this->deleteMasterDataByType($type, $periodId);

            foreach ($rows as $data) {
                if (empty(array_filter($data))) continue; // lewati baris kosong
                $this->insertMasterDataRow($type, $periodId, $data);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Data ' . ucfirst($type) . ' berhasil diimport.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Terjadi kesalahan saat import: ' . $e->getMessage());
        }
    }

    /**
     * Hapus seluruh data master berdasarkan tipe untuk periode tertentu.
     */
    public function destroyMasterData(Request $request)
    {
        $request->validate([
            'period_id' => 'required|exists:krs_periods,id',
            'type'      => 'required|in:matakuliah,dosen,ruang,waktu',
        ]);

        DB::transaction(function () use ($request) {
            $this->deleteMasterDataByType($request->type, $request->period_id);
        });

        return redirect()->back()->with('success', "Data {$request->type} berhasil dihapus.");
    }

    /**
     * Hapus satu record master data berdasarkan tipe dan ID.
     */
    public function destroySingleMasterData(string $type, int $id)
    {
        if (!array_key_exists($type, $this->typeModelMap)) {
            abort(404);
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

        return redirect()->back()->with('success', "Data {$type} berhasil dihapus.");
    }

    public function storeMasterData(Request $request)
    {
        $request->validate([
            'period_id' => 'required|exists:krs_periods,id',
            'type'      => 'required|in:matakuliah,dosen,ruang',
        ]);

        $type = $request->type;
        $periodId = $request->period_id;

        if ($type === 'matakuliah') {
            $request->validate([
                'kode_mp' => 'required|string|max:255',
                'nama_mp' => 'required|string|max:255',
                'kelas' => 'required|string|max:255',
                'pj' => 'required|integer|min:1',
            ]);
            $mk = KrsMatakuliah::create([
                'krs_period_id'    => $periodId,
                'kode_mk'          => $request->kode_mp,
                'nama_mk'          => $request->nama_mp,
                'kelas'            => $request->kelas,
                'sks'              => $request->pj,
                'jumlah_mahasiswa' => null,
            ]);
            KrsJadwalPlot::create([
                'krs_period_id'     => $periodId,
                'krs_matakuliah_id' => $mk->id,
                'is_conflict'       => false,
                'conflict_message'  => null,
            ]);
        } elseif ($type === 'dosen') {
            $request->validate([
                'nama_pendidik' => 'required|string|max:255',
                'kode_mp' => 'required|string|max:255',
                'max_pj' => 'nullable|integer|min:1',
            ]);
            KrsDosen::create([
                'krs_period_id' => $periodId,
                'nama_dosen'    => $request->nama_pendidik,
                'kode_mk'       => $request->kode_mp,
                'prioritas'     => null,
                'max_sks'       => $request->max_pj,
            ]);
        } elseif ($type === 'ruang') {
            $request->validate([
                'nama_ruang' => 'required|string|max:255',
                'kapasitas' => 'required|integer|min:1',
            ]);
            KrsRuang::create([
                'krs_period_id' => $periodId,
                'kode_ruang'    => strtoupper(str_replace(' ', '_', $request->nama_ruang)),
                'nama_ruang'    => $request->nama_ruang,
                'kapasitas'     => $request->kapasitas,
                'jenis_ruang'   => null,
            ]);
        }

        return redirect()->back()->with('success', 'Data master berhasil ditambahkan secara manual.');
    }

    public function updateHariAktif(Request $request)
    {
        $request->validate([
            'period_id'  => 'required|exists:krs_periods,id',
            'hari_aktif' => 'required|array|min:1',
        ]);

        $period = KrsPeriod::findOrFail($request->period_id);
        $period->hari_aktif = $request->hari_aktif;
        $period->save();

        return redirect()->back()->with('success', 'Hari Aktif berhasil disimpan.');
    }

    public function generateWaktu(Request $request)
    {
        $request->validate([
            'period_id'        => 'required|exists:krs_periods,id',
            'jam_mulai'        => 'required|date_format:H:i',
            'durasi_sks'       => 'required|integer|min:1',
            'jumlah_slot'      => 'required|integer|min:1|max:30',
            'is_istirahat'     => 'boolean',
            'istirahat_mulai'  => 'nullable|required_if:is_istirahat,true|date_format:H:i',
            'istirahat_selesai'=> 'nullable|required_if:is_istirahat,true|date_format:H:i',
        ]);

        $period = KrsPeriod::findOrFail($request->period_id);

        DB::transaction(function () use ($request, $period) {
            // Hapus waktu lama dan kosongkan referensi dari tabel plots
            KrsWaktu::where('krs_period_id', $period->id)->delete();
            KrsJadwalPlot::where('krs_period_id', $period->id)->update(['krs_waktu_ids' => null]);

            $currentTime      = \Carbon\Carbon::createFromFormat('H:i', $request->jam_mulai);
            $istirahatMulai   = $request->is_istirahat && $request->istirahat_mulai
                ? \Carbon\Carbon::createFromFormat('H:i', $request->istirahat_mulai)
                : null;
            $istirahatSelesai = $request->is_istirahat && $request->istirahat_selesai
                ? \Carbon\Carbon::createFromFormat('H:i', $request->istirahat_selesai)
                : null;

            for ($i = 0; $i < $request->jumlah_slot; $i++) {
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
                $currentTime->addMinutes((int) $request->durasi_sks);
                $jamSelesai = $currentTime->format('H:i');

                KrsWaktu::create([
                    'krs_period_id' => $period->id,
                    'jam_mulai'     => $jamMulai,
                    'jam_selesai'   => $jamSelesai,
                    'durasi_menit'  => (int) $request->durasi_sks,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Data Waktu berhasil di-generate secara otomatis.');
    }

    public function plotOtomatis(Request $request, KrsPlottingService $service)
    {
        $request->validate(['period_id' => 'required|exists:krs_periods,id']);
        $service->plotAuto($request->period_id);
        return redirect()->back()->with('success', 'Ploting otomatis selesai.');
    }

    public function resetPlot(Request $request)
    {
        $request->validate(['period_id' => 'required|exists:krs_periods,id']);
        KrsJadwalPlot::where('krs_period_id', $request->period_id)->update([
            'krs_dosen_id'     => null,
            'krs_ruang_id'     => null,
            'hari'             => null,
            'krs_waktu_ids'    => null,
            'is_conflict'      => false,
            'conflict_message' => null,
        ]);
        return redirect()->back()->with('success', 'Plot berhasil direset.');
    }

    public function resetSemuaPlot(Request $request)
    {
        $request->validate(['period_id' => 'required|exists:krs_periods,id']);
        KrsJadwalPlot::where('krs_period_id', $request->period_id)->delete();
        return redirect()->back()->with('success', 'Semua hasil plot dihapus.');
    }

    public function updatePlot(Request $request, int $id, KrsPlottingService $service)
    {
        $plot = KrsJadwalPlot::findOrFail($id);

        $plot->update([
            'krs_dosen_id'     => $request->krs_dosen_id,
            'krs_ruang_id'     => $request->krs_ruang_id,
            'hari'             => $request->hari,
            'krs_waktu_ids'    => $request->krs_waktu_ids,
            // Sementara false; validateConflicts() akan menghitung nilai sesungguhnya
            'is_conflict'      => false,
            'conflict_message' => null,
        ]);

        $service->validateConflicts($plot->krs_period_id);

        return redirect()->back()->with('success', 'Plot manual diperbarui. Validasi bentrok telah dijalankan ulang.');
    }

    public function exportCsv(Request $request)
    {
        $periodId = $request->query('period_id');
        $plots    = KrsJadwalPlot::with(['matakuliah', 'dosen', 'ruang'])
            ->where('krs_period_id', $periodId)
            ->get();
        $waktus   = KrsWaktu::where('krs_period_id', $periodId)->get();

        $headers = [
            'Content-type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=jadwal_krs_{$periodId}.csv",
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $callback = function () use ($plots, $waktus) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Kode MP', 'Nama MP', 'Kelas', 'PJ', 'Pendidik', 'Ruang', 'Hari', 'Jam', 'Status']);

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

                fputcsv($file, [
                    $plot->matakuliah?->kode_mk,
                    $plot->matakuliah?->nama_mk,
                    $plot->matakuliah?->kelas,
                    $plot->matakuliah?->sks,
                    $plot->dosen?->nama_dosen ?? '-',
                    $plot->ruang?->nama_ruang ?? '-',
                    $hariStr,
                    $waktuStr,
                    $plot->is_conflict ? 'Konflik: ' . $plot->conflict_message : 'Aman',
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function updateDosenMaxSks(Request $request, int $id)
    {
        $dosen          = KrsDosen::findOrFail($id);
        $dosen->max_sks = ($request->max_sks !== null && $request->max_sks !== '')
            ? (int) $request->max_sks
            : null;
        $dosen->save();

        return redirect()->back()->with('success', 'Batas PJ Pendidik berhasil diperbarui.');
    }

    public function autoCalculateMaxSks(Request $request)
    {
        $periodId = $request->period_id;
        if (!$periodId) {
            return redirect()->back()->with('error', 'Periode aktif tidak ditemukan.');
        }

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

            $filledDosens = $dosens->whereNotNull('max_sks');
            $emptyDosens  = $dosens->whereNull('max_sks');

            if ($emptyDosens->count() === 0) continue;

            // Hitung berapa kelas yang sudah diambil oleh dosen dengan max_sks manual
            $usedClasses = 0;
            foreach ($filledDosens as $fd) {
                $usedClasses += floor($fd->max_sks / $sksPerClass);
            }

            $remainingClasses = max(0, $totalClasses - $usedClasses);
            $avgClasses       = (int) ceil($remainingClasses / $emptyDosens->count());
            $avgSks           = $avgClasses * $sksPerClass;

            foreach ($emptyDosens as $d) {
                $d->max_sks = $avgSks;
                $d->save();
            }
        }

        return redirect()->back()->with('success', 'Max PJ berhasil dihitung dan dibagikan secara otomatis!');
    }

    // =========================================================================
    // Private Helpers — menghilangkan duplikasi pola if-elseif berulang
    // =========================================================================

    /**
     * Parse file upload (CSV/TXT atau Excel) menjadi array baris data.
     */
    private function parseUploadedFile($file, string $extension): array
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
     * Hapus data master untuk tipe dan periode tertentu.
     * Untuk tipe 'ruang': otomatis tambahkan ruang DARING setelah hapus.
     * Untuk tipe 'waktu': kosongkan referensi waktu di tabel plots.
     */
    private function deleteMasterDataByType(string $type, int $periodId): void
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
                'jumlah_mahasiswa' => isset($data[4]) ? (int) $data[4] : null,
            ]);
            KrsJadwalPlot::create([
                'krs_period_id'     => $periodId,
                'krs_matakuliah_id' => $mk->id,
                'is_conflict'       => false,
                'conflict_message'  => null,
            ]);
            return;
        }

        match ($type) {
            'dosen' => KrsDosen::create([
                'krs_period_id' => $periodId,
                'nama_dosen'    => $data[0] ?? '',      // kolom 0: nama_dosen
                'kode_mk'       => $data[1] ?? '',      // kolom 1: kode_mk
                'prioritas'     => isset($data[2]) ? (int) $data[2] : null, // kolom 2: prioritas
                'max_sks'       => isset($data[3]) ? (int) $data[3] : null, // kolom 3: max_sks
            ]),

            'ruang' => KrsRuang::create([
                'krs_period_id' => $periodId,
                'kode_ruang'    => $data[0] ?? '',
                'nama_ruang'    => $data[1] ?? '',
                'kapasitas'     => (int) ($data[2] ?? 0),
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
