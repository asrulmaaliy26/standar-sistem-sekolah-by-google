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

            // Compute dynamic conflict groups for UI color coding
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
            'periods' => $periods,
            'activePeriodId' => (int) $activePeriodId,
            'plots' => $plots,
            'matakuliahs' => $matakuliahs,
            'dosens' => $dosens,
            'ruangs' => $ruangs,
            'waktus' => $waktus,
        ]);
    }

    public function storePeriod(Request $request)
    {
        $request->validate([
            'tahun_akademik' => 'required|string',
            'semester' => 'required|in:Ganjil,Genap',
        ]);

        DB::transaction(function () use ($request) {
            KrsPeriod::query()->update(['is_active' => false]);
            KrsPeriod::create([
                'tahun_akademik' => $request->tahun_akademik,
                'semester' => $request->semester,
                'is_active' => true,
            ]);
        });

        return redirect()->back()->with('success', 'Periode berhasil ditambahkan.');
    }

    public function downloadTemplate($type)
    {
        $headers = [];
        if ($type === 'matakuliah') {
            $headers = ['kode_mk', 'nama_mk', 'kelas', 'sks', 'jumlah_mahasiswa'];
        } else if ($type === 'dosen') {
            $headers = ['kode_mk', 'kelas', 'dosen_pengampu'];
        } else if ($type === 'ruang') {
            $headers = ['nama_ruang', 'kapasitas'];
        } else if ($type === 'waktu') {
            $headers = ['jam_mulai', 'jam_selesai'];
        } else {
            abort(404);
        }

        $callback = function () use ($headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            fclose($file);
        };

        return response()->streamDownload($callback, "template_{$type}.csv", [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function importCsv(Request $request)
    {
        $request->validate([
            'type' => 'required|in:matakuliah,dosen,ruang,waktu',
            'file' => 'required|file|mimes:csv,txt,xlsx,xls',
            'period_id' => 'required|exists:krs_periods,id'
        ]);

        $file = $request->file('file');
        $type = $request->type;
        $periodId = $request->period_id;

        $extension = $file->getClientOriginalExtension();

        $rows = [];
        if (in_array(strtolower($extension), ['csv', 'txt'])) {
            $handle = fopen($file->getRealPath(), 'r');
            $header = fgetcsv($handle, 1000, ',');
            while (($data = fgetcsv($handle, 1000, ',')) !== false) {
                $rows[] = $data;
            }
            fclose($handle);
        } else {
            $import = new class implements \Maatwebsite\Excel\Concerns\ToArray {
                public function array(array $array) {}
            };
            $sheets = \Maatwebsite\Excel\Facades\Excel::toArray($import, $file);
            $rows = $sheets[0] ?? [];
            if (count($rows) > 0) array_shift($rows); // remove header
        }

        DB::beginTransaction();
        try {
            // Delete old data before inserting new ones
            if ($type === 'matakuliah') {
                KrsMatakuliah::where('krs_period_id', $periodId)->delete();
            } else if ($type === 'dosen') {
                KrsDosen::where('krs_period_id', $periodId)->delete();
            } else if ($type === 'ruang') {
                KrsRuang::where('krs_period_id', $periodId)->delete();
                
                // Secara otomatis tambahkan ruang DARING di urutan pertama
                KrsRuang::create([
                    'krs_period_id' => $periodId,
                    'kode_ruang' => 'DARING',
                    'nama_ruang' => 'DARING',
                    'kapasitas' => 9999,
                    'jenis_ruang' => 'Daring'
                ]);
            } else if ($type === 'waktu') {
                KrsWaktu::where('krs_period_id', $periodId)->delete();
                // Clear time references from plots to prevent orphaned JSON IDs
                KrsJadwalPlot::where('krs_period_id', $periodId)->update(['krs_waktu_ids' => null]);
            }

            foreach ($rows as $data) {
                if (empty(array_filter($data))) continue; // skip completely empty rows
                if ($type === 'matakuliah') {
                    // Expecting: kode_mk, nama_mk, kelas, sks, jumlah_mahasiswa
                    $mk = KrsMatakuliah::create([
                        'krs_period_id' => $periodId,
                        'kode_mk' => $data[0] ?? '',
                        'nama_mk' => $data[1] ?? '',
                        'kelas' => $data[2] ?? '',
                        'sks' => (int)($data[3] ?? 0),
                        'jumlah_mahasiswa' => isset($data[4]) ? (int)$data[4] : null,
                    ]);
                    
                    KrsJadwalPlot::create([
                        'krs_period_id' => $periodId,
                        'krs_matakuliah_id' => $mk->id,
                        'is_conflict' => false,
                        'conflict_message' => null,
                    ]);
                } else if ($type === 'dosen') {
                    // Expecting: nama_dosen, kode_mk, prioritas, max_sks
                    KrsDosen::create([
                        'krs_period_id' => $periodId,
                        'nama_dosen' => $data[0] ?? '',
                        'kode_mk' => $data[1] ?? '',
                        'prioritas' => isset($data[2]) ? (int)$data[2] : null,
                        'max_sks' => isset($data[3]) ? (int)$data[3] : null,
                    ]);
                } else if ($type === 'ruang') {
                    // Expecting: kode_ruang, nama_ruang, kapasitas, jenis_ruang
                    KrsRuang::create([
                        'krs_period_id' => $periodId,
                        'kode_ruang' => $data[0] ?? '',
                        'nama_ruang' => $data[1] ?? '',
                        'kapasitas' => (int)($data[2] ?? 0),
                        'jenis_ruang' => $data[3] ?? null,
                    ]);
                } else if ($type === 'waktu') {
                    // Expecting: mulai, selesai (e.g. 06.30, 07.20)
                    $rawMulai = str_replace('.', ':', trim($data[0] ?? '00:00'));
                    $rawSelesai = str_replace('.', ':', trim($data[1] ?? '00:00'));
                    
                    if (strtolower($rawMulai) === 'mulai') continue;

                    try {
                        $mulai = \Carbon\Carbon::createFromFormat('H:i', $rawMulai);
                        $selesai = \Carbon\Carbon::createFromFormat('H:i', $rawSelesai);
                    } catch (\Exception $e) {
                        continue;
                    }

                    $durasi = $mulai->diffInMinutes($selesai);
                    
                    KrsWaktu::create([
                        'krs_period_id' => $periodId,
                        'jam_mulai' => $mulai->format('H:i:s'),
                        'jam_selesai' => $selesai->format('H:i:s'),
                        'durasi_menit' => $durasi,
                    ]);
                }
            }
            DB::commit();
            return redirect()->back()->with('success', 'Data ' . ucfirst($type) . ' berhasil diimport.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Terjadi kesalahan saat import: ' . $e->getMessage());
        }
    }

    public function destroyMasterData(Request $request)
    {
        $request->validate([
            'period_id' => 'required|exists:krs_periods,id',
            'type' => 'required|in:matakuliah,dosen,ruang,waktu'
        ]);

        $type = $request->type;
        $periodId = $request->period_id;

        DB::transaction(function() use ($type, $periodId) {
            if ($type === 'matakuliah') {
                KrsMatakuliah::where('krs_period_id', $periodId)->delete();
            } else if ($type === 'dosen') {
                KrsDosen::where('krs_period_id', $periodId)->delete();
            } else if ($type === 'ruang') {
                KrsRuang::where('krs_period_id', $periodId)->delete();
            } else if ($type === 'waktu') {
                KrsWaktu::where('krs_period_id', $periodId)->delete();
                KrsJadwalPlot::where('krs_period_id', $periodId)->update(['krs_waktu_ids' => null]);
            }
        });

        return redirect()->back()->with('success', "Data $type berhasil dihapus.");
    }

    public function destroySingleMasterData($type, $id, Request $request)
    {
        if ($type === 'matakuliah') {
            KrsMatakuliah::findOrFail($id)->delete();
        } else if ($type === 'dosen') {
            KrsDosen::findOrFail($id)->delete();
        } else if ($type === 'ruang') {
            KrsRuang::findOrFail($id)->delete();
        } else if ($type === 'waktu') {
            $waktu = KrsWaktu::findOrFail($id);
            // Clear from plots if necessary
            KrsJadwalPlot::where('krs_period_id', $waktu->krs_period_id)->update(['krs_waktu_ids' => null]);
            $waktu->delete();
        }

        return redirect()->back()->with('success', "Data $type berhasil dihapus.");
    }

    public function updateHariAktif(Request $request)
    {
        $request->validate([
            'period_id' => 'required|exists:krs_periods,id',
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
            'period_id' => 'required|exists:krs_periods,id',
            'jam_mulai' => 'required|date_format:H:i',
            'durasi_sks' => 'required|integer|min:1',
            'jumlah_slot' => 'required|integer|min:1|max:30',
            'is_istirahat' => 'boolean',
            'istirahat_mulai' => 'nullable|required_if:is_istirahat,true|date_format:H:i',
            'istirahat_selesai' => 'nullable|required_if:is_istirahat,true|date_format:H:i',
        ]);

        $period = KrsPeriod::findOrFail($request->period_id);

        DB::transaction(function () use ($request, $period) {

            // Hapus waktu lama dan kosongkan referensi dari tabel plots
            KrsWaktu::where('krs_period_id', $period->id)->delete();
            KrsJadwalPlot::where('krs_period_id', $period->id)->update(['krs_waktu_ids' => null]);

            $currentTime = \Carbon\Carbon::createFromFormat('H:i', $request->jam_mulai);
            $istirahatMulai = $request->is_istirahat && $request->istirahat_mulai ? \Carbon\Carbon::createFromFormat('H:i', $request->istirahat_mulai) : null;
            $istirahatSelesai = $request->is_istirahat && $request->istirahat_selesai ? \Carbon\Carbon::createFromFormat('H:i', $request->istirahat_selesai) : null;

            for ($i = 0; $i < $request->jumlah_slot; $i++) {
                // Lewati waktu istirahat jika overlap
                if ($istirahatMulai && $istirahatSelesai) {
                    if ($currentTime->format('H:i') >= $istirahatMulai->format('H:i') && $currentTime->format('H:i') < $istirahatSelesai->format('H:i')) {
                        $currentTime = $istirahatSelesai->copy();
                    }
                }

                $jamMulai = $currentTime->format('H:i');
                $currentTime->addMinutes((int) $request->durasi_sks);
                $jamSelesai = $currentTime->format('H:i');

                KrsWaktu::create([
                    'krs_period_id' => $period->id,
                    'jam_mulai' => $jamMulai,
                    'jam_selesai' => $jamSelesai,
                    'durasi_menit' => (int) $request->durasi_sks,
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
            'krs_dosen_id' => null,
            'krs_ruang_id' => null,
            'hari' => null,
            'krs_waktu_ids' => null,
            'is_conflict' => false,
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

    public function updatePlot(Request $request, $id, KrsPlottingService $service)
    {
        $plot = KrsJadwalPlot::findOrFail($id);
        
        $plot->update([
            'krs_dosen_id' => $request->krs_dosen_id,
            'krs_ruang_id' => $request->krs_ruang_id,
            'hari' => $request->hari,
            'krs_waktu_ids' => $request->krs_waktu_ids,
            // Temporarily set to false, validateConflicts will compute the real value
            'is_conflict' => false, 
            'conflict_message' => null
        ]);

        $service->validateConflicts($plot->krs_period_id);

        return redirect()->back()->with('success', 'Plot manual diperbarui. Validasi bentrok telah dijalankan ulang.');
    }

    public function exportCsv(Request $request)
    {
        $periodId = $request->query('period_id');
        $plots = KrsJadwalPlot::with(['matakuliah', 'dosen', 'ruang'])->where('krs_period_id', $periodId)->get();
        $waktus = KrsWaktu::where('krs_period_id', $periodId)->get();

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=jadwal_krs_$periodId.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($plots, $waktus) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Kode MK', 'Nama MK', 'Kelas', 'SKS', 'Dosen', 'Ruang', 'Hari', 'Jam', 'Status']);

            foreach ($plots as $plot) {
                $waktuStr = '';
                $hariStr = $plot->hari ?? '-';
                if ($plot->krs_waktu_ids) {
                    $plotWaktus = collect($plot->krs_waktu_ids)->map(fn($id) => $waktus->firstWhere('id', $id))->filter()->values();
                    if ($plotWaktus->count() > 0) {
                        $jamMulai = $plotWaktus->first()->jam_mulai;
                        $jamSelesai = $plotWaktus->last()->jam_selesai;
                        $waktuStr = "$jamMulai - $jamSelesai";
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
                    $plot->is_conflict ? 'Konflik: ' . $plot->conflict_message : 'Aman'
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function updateDosenMaxSks(Request $request, $id)
    {
        $dosen = \App\Models\KrsDosen::findOrFail($id);
        $dosen->max_sks = $request->max_sks !== null && $request->max_sks !== '' ? (int) $request->max_sks : null;
        $dosen->save();

        return redirect()->back()->with('success', 'Batas SKS Dosen berhasil diperbarui.');
    }

    public function autoCalculateMaxSks(Request $request)
    {
        $periodId = $request->period_id;
        if (!$periodId) return redirect()->back()->with('error', 'Periode aktif tidak ditemukan.');

        $mks = \App\Models\KrsMatakuliah::where('krs_period_id', $periodId)->get();
        $mkGroups = $mks->groupBy('kode_mk');

        foreach ($mkGroups as $kodeMk => $classes) {
            $totalClasses = $classes->count();
            // Assuming all classes of the same kode_mk have the same SKS
            $sksPerClass = $classes->first()->sks; 
            $totalSks = $totalClasses * $sksPerClass;
            
            $dosens = \App\Models\KrsDosen::where('krs_period_id', $periodId)
                ->where('kode_mk', $kodeMk)
                ->get();

            if ($dosens->count() > 0) {
                $filledDosens = $dosens->whereNotNull('max_sks');
                $emptyDosens = $dosens->whereNull('max_sks');
                
                if ($emptyDosens->count() > 0) {
                    // Hitung berapa kelas yang sudah diambil oleh dosen yang max_sks nya di set manual
                    $usedClasses = 0;
                    foreach ($filledDosens as $fd) {
                        $usedClasses += floor($fd->max_sks / $sksPerClass);
                    }
                    
                    $remainingClasses = $totalClasses - $usedClasses;
                    if ($remainingClasses < 0) $remainingClasses = 0;
                    
                    // Pembagian jumlah kelas yang tersisa ke dosen yang kosong
                    $avgClasses = ceil($remainingClasses / $emptyDosens->count());
                    $avgSks = $avgClasses * $sksPerClass;
                    
                    foreach ($emptyDosens as $d) {
                        $d->max_sks = $avgSks;
                        $d->save();
                    }
                }
            }
        }

        return redirect()->back()->with('success', 'Max SKS berhasil dihitung dan dibagikan secara otomatis!');
    }
}
