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
use App\Services\KrsCsvService;
use App\Services\KrsMasterDataService;
use Illuminate\Support\Facades\DB;
use Exception;

class KrsSchedulingController extends Controller
{
    private KrsCsvService $csvService;
    private KrsMasterDataService $masterDataService;

    public function __construct(KrsCsvService $csvService, KrsMasterDataService $masterDataService)
    {
        $this->csvService = $csvService;
        $this->masterDataService = $masterDataService;
    }

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

            $plots = KrsJadwalPlot::with(['matakuliah', 'dosen', 'dosenKedua', 'ruang'])
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

        $readiness_data = null;
        if ($activePeriodId) {
            $total_sks_mapel = $matakuliahs->sum('sks');
            $total_kapasitas_guru = $dosens->sum('max_sks');

            $total_ruang_fisik = $ruangs->filter(function ($ruang) {
                $nama = strtolower($ruang->nama_ruang);
                return !str_contains($nama, 'daring') && !str_contains($nama, 'online');
            })->count();

            $activePeriod = $periods->firstWhere('id', $activePeriodId);
            $hari_aktif_count = $activePeriod && $activePeriod->hari_aktif && is_array($activePeriod->hari_aktif) && count($activePeriod->hari_aktif) > 0
                ? count($activePeriod->hari_aktif)
                : 6;

            $total_slot_waktu = $waktus->count() * $hari_aktif_count;
            $total_kapasitas_ruang = $total_ruang_fisik * $total_slot_waktu;

            $total_guru = $dosens->unique(fn($d) => trim($d->nama_dosen))->count();
            $slot_per_hari = $waktus->count();

            $jenis_ruang_kebutuhan = [];
            foreach ($matakuliahs as $mk) {
                if (!empty(trim($mk->jenis_ruang))) {
                    $jenis = strtolower(trim($mk->jenis_ruang));
                    $jenis_ruang_kebutuhan[$jenis] = ($jenis_ruang_kebutuhan[$jenis] ?? 0) + $mk->sks;
                }
            }

            $jenis_ruang_kapasitas = [];
            foreach ($ruangs as $ruang) {
                $nama = strtolower($ruang->nama_ruang);
                if (str_contains($nama, 'daring') || str_contains($nama, 'online')) continue;
                
                if (!empty(trim($ruang->kapasitas))) {
                    $jenis = strtolower(trim($ruang->kapasitas));
                    $jenis_ruang_kapasitas[$jenis] = ($jenis_ruang_kapasitas[$jenis] ?? 0) + ($slot_per_hari * $hari_aktif_count);
                }
            }

            $status_ruang_detail = [];
            $status_ruang_overall = $total_sks_mapel <= $total_kapasitas_ruang ? 'OK' : 'KURANG';
            
            foreach ($jenis_ruang_kebutuhan as $jenis => $kebutuhan) {
                $kapasitas = $jenis_ruang_kapasitas[$jenis] ?? 0;
                $status = $kebutuhan <= $kapasitas ? 'OK' : 'KURANG';
                if ($status === 'KURANG') {
                    $status_ruang_overall = 'KURANG';
                }
                $status_ruang_detail[] = [
                    'jenis' => ucwords($jenis),
                    'kebutuhan' => $kebutuhan,
                    'kapasitas' => $kapasitas,
                    'status' => $status
                ];
            }

            $readiness_data = [
                'total_sks_mapel' => $total_sks_mapel,
                'total_guru' => $total_guru,
                'total_kapasitas_guru' => $total_kapasitas_guru,
                'total_ruang_fisik' => $total_ruang_fisik,
                'hari_aktif_count' => $hari_aktif_count,
                'slot_per_hari' => $slot_per_hari,
                'total_slot_waktu' => $total_slot_waktu,
                'total_kapasitas_ruang' => $total_kapasitas_ruang,
                'status_guru' => ($total_kapasitas_guru == 0 || $total_sks_mapel <= $total_kapasitas_guru) ? 'OK' : 'KURANG',
                'status_ruang' => $status_ruang_overall,
                'status_ruang_detail' => $status_ruang_detail,
            ];
        }

        return Inertia::render('Admin/Krs/Index', [
            'periods'       => $periods,
            'activePeriodId' => (int) $activePeriodId,
            'plots'         => $plots,
            'matakuliahs'   => $matakuliahs,
            'dosens'        => $dosens,
            'ruangs'        => $ruangs,
            'waktus'        => $waktus,
            'readiness_data' => $readiness_data,
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

    public function downloadTemplate(string $type)
    {
        try {
            $headers  = $this->csvService->getTemplateHeaders($type);
            $examples = $this->csvService->getTemplateRows($type);

            $callback = function () use ($headers, $examples) {
                $file = fopen('php://output', 'w');
                fputcsv($file, $headers);
                foreach ($examples as $row) {
                    fputcsv($file, $row);
                }
                fclose($file);
            };

            return response()->streamDownload($callback, "template_{$type}.csv", [
                'Content-Type' => 'text/csv',
            ]);
        } catch (Exception $e) {
            abort(404);
        }
    }

    public function importCsv(Request $request)
    {
        $request->validate([
            'type'      => 'required|in:matakuliah,dosen,ruang,waktu,import_lengkap',
            'file'      => 'required|file|mimes:csv,txt,xlsx,xls',
            'period_id' => 'required|exists:krs_periods,id',
        ]);

        try {
            $this->csvService->importCsv(
                $request->file('file'), 
                $request->type, 
                $request->period_id, 
                $this->masterDataService
            );
            return redirect()->back()->with('success', 'Data ' . ucfirst($request->type) . ' berhasil diimport.');
        } catch (Exception $e) {
            return redirect()->back()->with('error', 'Terjadi kesalahan saat import: ' . $e->getMessage());
        }
    }

    public function destroyMasterData(Request $request)
    {
        $request->validate([
            'period_id' => 'required|exists:krs_periods,id',
            'type'      => 'required|in:matakuliah,dosen,ruang,waktu,import_lengkap',
        ]);

        DB::transaction(function () use ($request) {
            $this->masterDataService->deleteMasterDataByType($request->type, $request->period_id);
        });

        return redirect()->back()->with('success', "Data {$request->type} berhasil dihapus.");
    }

    public function destroySingleMasterData(string $type, int $id)
    {
        try {
            $this->masterDataService->destroySingleMasterData($type, $id);
            return redirect()->back()->with('success', "Data {$type} berhasil dihapus.");
        } catch (Exception $e) {
            abort(404);
        }
    }

    public function storeMasterData(Request $request)
    {
        $request->validate([
            'period_id' => 'required|exists:krs_periods,id',
            'type'      => 'required|in:matakuliah,dosen,ruang',
        ]);

        $type = $request->type;

        if ($type === 'matakuliah') {
            $request->validate([
                'kode_mp' => 'required|string|max:255',
                'nama_mp' => 'required|string|max:255',
                'kelas' => 'required|string|max:255',
                'pj' => 'required|integer|min:1',
            ]);
        } elseif ($type === 'dosen') {
            $request->validate([
                'nama_pendidik' => 'required|string|max:255',
                'kode_mp' => 'required|string|max:255',
                'kelas' => 'nullable|string|max:255',
                'max_pj' => 'nullable|integer|min:1',
            ]);
        } elseif ($type === 'ruang') {
            $request->validate([
                'nama_ruang' => 'required|string|max:255',
                'kapasitas' => 'required|string|max:255',
            ]);
        }

        $this->masterDataService->storeMasterData($type, $request->period_id, $request->all());

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
            'istirahat_selesai' => 'nullable|required_if:is_istirahat,true|date_format:H:i',
        ]);

        $this->masterDataService->generateWaktu(
            $request->period_id,
            $request->jam_mulai,
            $request->durasi_sks,
            $request->jumlah_slot,
            $request->is_istirahat ?? false,
            $request->istirahat_mulai,
            $request->istirahat_selesai
        );

        return redirect()->back()->with('success', 'Data Waktu berhasil di-generate secara otomatis.');
    }

    public function plotOtomatis(Request $request, KrsPlottingService $service)
    {
        $request->validate(['period_id' => 'required|exists:krs_periods,id']);
        $service->plotAuto($request->period_id, $request->batasan_waktu, $request->batasan_waktu_2, $request->batasan_waktu_3);
        return redirect()->back()->with('success', 'Ploting otomatis selesai.');
    }

    public function plotOtomatisStream(Request $request, KrsPlottingService $service)
    {
        $request->validate(['period_id' => 'required|exists:krs_periods,id']);

        return response()->stream(function () use ($service, $request) {
            @ini_set('output_buffering', 'off');
            @ini_set('zlib.output_compression', false);
            @ini_set('implicit_flush', true);
            ob_implicit_flush(true);

            while (ob_get_level() > 0) {
                ob_end_flush();
            }
            
            // Padding 64KB agar php artisan serve (built-in server) tidak mem-buffer respon awal
            echo str_repeat(' ', 65536) . "\n\n";
            flush();

            $service->plotAutoIterative(
                $request->period_id, 
                $request->batasan_waktu, 
                $request->batasan_waktu_2, 
                $request->batasan_waktu_3,
                15 // Max iterations (Sets)
            );
        }, 200, [
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Content-Type'  => 'text/event-stream',
            'Connection'    => 'keep-alive',
        ]);
    }

    public function resetPlot(Request $request)
    {
        $request->validate(['period_id' => 'required|exists:krs_periods,id']);
        KrsJadwalPlot::where('krs_period_id', $request->period_id)->update([
            'krs_ruang_id'     => null,
            'hari'             => null,
            'krs_waktu_ids'    => null,
            'is_conflict'      => false,
            'conflict_message' => null,
        ]);
        return redirect()->back()->with('success', 'Plot berhasil direset (Dosen tetap dipertahankan).');
    }

    public function resetSemuaPlot(Request $request)
    {
        $request->validate(['period_id' => 'required|exists:krs_periods,id']);
        
        DB::transaction(function () use ($request) {
            KrsJadwalPlot::where('krs_period_id', $request->period_id)->delete();
            KrsMatakuliah::where('krs_period_id', $request->period_id)->delete();
            KrsDosen::where('krs_period_id', $request->period_id)->delete();
        });

        return redirect()->back()->with('success', 'Semua hasil plot jadwal, master mapel, dan master dosen berhasil dihapus secara keseluruhan.');
    }

    public function updatePlot(Request $request, int $id, KrsPlottingService $service)
    {
        $plot = KrsJadwalPlot::findOrFail($id);

        $isLocked = !empty($request->hari) && !empty($request->krs_ruang_id) && !empty($request->krs_waktu_ids);

        $plot->update([
            'krs_dosen_id'       => $request->krs_dosen_id,
            'krs_dosen_kedua_id' => $request->krs_dosen_kedua_id,
            'krs_ruang_id'       => $request->krs_ruang_id,
            'hari'               => $request->hari,
            'krs_waktu_ids'    => $request->krs_waktu_ids,
            // Sementara false; validateConflicts() akan menghitung nilai sesungguhnya
            'is_conflict'      => false,
            'conflict_message' => null,
            'is_locked'        => $isLocked,
        ]);

        $service->validateConflicts($plot->krs_period_id);

        return redirect()->back()->with('success', 'Plot manual diperbarui. Validasi bentrok telah dijalankan ulang.');
    }

    public function exportCsv(Request $request)
    {
        $periodId = $request->query('period_id');
        $rows = $this->csvService->exportCsvData($periodId);

        $headers = [
            'Content-type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=jadwal_krs_{$periodId}.csv",
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $callback = function () use ($rows) {
            $file = fopen('php://output', 'w');
            foreach ($rows as $row) {
                fputcsv($file, $row);
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

        $this->masterDataService->autoCalculateMaxSks($periodId);

        return redirect()->back()->with('success', 'Max PJ berhasil dihitung dan dibagikan secara otomatis!');
    }
}
