<?php

namespace App\Services;

use App\Models\KrsPeriod;
use App\Models\KrsMatakuliah;
use App\Models\KrsDosen;
use App\Models\KrsRuang;
use App\Models\KrsWaktu;
use App\Models\KrsJadwalPlot;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class KrsPlottingService
{
    public function plotAutoIterative($periodId, $batasanWaktu = null, $batasanWaktu2 = null, $batasanWaktu3 = null, $batasanRuangan = null, $maxSets = 15)
    {
        $pad = ": " . str_repeat(' ', 65536) . "\n\n";
        echo "data: " . json_encode(['iteration' => 1, 'message' => "Set 1: Inisiasi plotting pertama..."]) . "\n\n" . $pad;
        @ob_flush(); flush();
        usleep(300000);

        // Hapus (reset) jadwal sebelumnya yang BELUM dikunci
        $lockedPlotIds = KrsJadwalPlot::where('krs_period_id', $periodId)
            ->where('is_locked', true)
            ->pluck('id')
            ->toArray();

        KrsJadwalPlot::where('krs_period_id', $periodId)
            ->whereNotIn('id', $lockedPlotIds)
            ->update([
                'hari' => null,
                'krs_ruang_id' => null,
                'krs_waktu_ids' => null,
                'is_conflict' => false,
                'conflict_message' => null
            ]);

        $this->plotAutoCore($periodId, $batasanWaktu, $batasanWaktu2, $batasanWaktu3, false);
        $score = $this->calculateScore($periodId, $batasanWaktu3);

        echo "data: " . json_encode(['iteration' => 1, 'score' => $score, 'message' => "Set 1 selesai. Sisa Konflik & Overload: $score"]) . "\n\n" . $pad;
        @ob_flush(); flush();

        if ($score == 0) {
            echo "data: " . json_encode(['done' => true, 'message' => "Selesai! Jadwal sempurna tanpa bentrok dan tanpa overload ditemukan."]) . "\n\n" . $pad;
            @ob_flush(); flush();
            usleep(300000);
            return;
        }

        $bestScore = $score;
        $bestPlots = KrsJadwalPlot::where('krs_period_id', $periodId)->get()->map(function($plot) {
            return $plot->getAttributes();
        })->toArray();

        for ($i = 2; $i <= $maxSets; $i++) {
            echo "data: " . json_encode(['iteration' => $i, 'message' => "Set $i: Membongkar jadwal yang konflik dan mengacak ulang..."]) . "\n\n" . $pad;
            @ob_flush(); flush();
            usleep(300000);

            // RUIN step: 1. Kosongkan jadwal yang konflik (kecuali yang dikunci)
            $conflicts = KrsJadwalPlot::where('krs_period_id', $periodId)->where('is_conflict', true)->get();
            foreach($conflicts as $c) {
                if (!in_array($c->id, $lockedPlotIds)) {
                    $c->update(['hari' => null, 'krs_ruang_id' => null, 'krs_waktu_ids' => null, 'is_conflict' => false, 'conflict_message' => null]);
                }
            }

            // RUIN step: 2. Hitung overload harian dan hapus jadwal yang membuat dosen overload
            $successes = KrsJadwalPlot::where('krs_period_id', $periodId)->where('is_conflict', false)->with(['matakuliah', 'dosen', 'dosenKedua'])->get();
            $dailyLoad = [];
            foreach ($successes as $s) {
                if ($s->hari && $s->matakuliah) {
                    $divisor = $s->krs_dosen_kedua_id ? 2 : 1;
                    $addedSks = $s->matakuliah->sks / $divisor;

                    if ($s->krs_dosen_id && $s->dosen) {
                        $namaDosen = strtolower(trim($s->dosen->nama_dosen));
                        if (!isset($dailyLoad[$s->hari][$namaDosen])) {
                            $dailyLoad[$s->hari][$namaDosen] = 0;
                        }
                        $dailyLoad[$s->hari][$namaDosen] += $addedSks;
                    }
                    if ($s->krs_dosen_kedua_id && $s->dosenKedua) {
                        $namaDosen2 = strtolower(trim($s->dosenKedua->nama_dosen));
                        if (!isset($dailyLoad[$s->hari][$namaDosen2])) {
                            $dailyLoad[$s->hari][$namaDosen2] = 0;
                        }
                        $dailyLoad[$s->hari][$namaDosen2] += $addedSks;
                    }
                }
            }

            $cleanSuccesses = [];
            $rule3Active = $batasanWaktu3['aktif'] ?? true;
            foreach ($successes as $s) {
                $isOverload = false;
                if ($rule3Active && $s->hari) {
                    if ($s->krs_dosen_id && $s->dosen) {
                        $namaDosen = strtolower(trim($s->dosen->nama_dosen));
                        if (($dailyLoad[$s->hari][$namaDosen] ?? 0) > 6) {
                            $isOverload = true;
                        }
                    }
                    if ($s->krs_dosen_kedua_id && $s->dosenKedua) {
                        $namaDosen2 = strtolower(trim($s->dosenKedua->nama_dosen));
                        if (($dailyLoad[$s->hari][$namaDosen2] ?? 0) > 6) {
                            $isOverload = true;
                        }
                    }
                }

                if ($isOverload) {
                    if (!in_array($s->id, $lockedPlotIds)) {
                        $s->update(['hari' => null, 'krs_ruang_id' => null, 'krs_waktu_ids' => null, 'is_conflict' => false, 'conflict_message' => null]);
                    }
                } else {
                    if (!in_array($s->id, $lockedPlotIds)) {
                        $cleanSuccesses[] = $s;
                    }
                }
            }

            // RUIN step: 3. Kosongkan sebagian (25%) jadwal yang sukses dan aman secara acak untuk memberi ruang
            $successesCollection = collect($cleanSuccesses);
            $numToRuin = max(1, (int)($successesCollection->count() * 0.25));
            if ($successesCollection->count() > 0) {
                $ruinTargets = $successesCollection->random(min($numToRuin, $successesCollection->count()));
                foreach($ruinTargets as $r) {
                    $r->update(['hari' => null, 'krs_ruang_id' => null, 'krs_waktu_ids' => null, 'is_conflict' => false, 'conflict_message' => null]);
                }
            }

            // RECREATE step:
            $this->plotAutoCore($periodId, $batasanWaktu, $batasanWaktu2, $batasanWaktu3, $batasanRuangan, true);
            
            // Validasi ulang untuk memastikan status konflik termutakhir
            $this->validateConflicts($periodId);

            $currentScore = $this->calculateScore($periodId, $batasanWaktu3);
            echo "data: " . json_encode(['iteration' => $i, 'score' => $currentScore, 'message' => "Set $i selesai. Sisa Konflik & Overload: $currentScore"]) . "\n\n" . $pad;
            @ob_flush(); flush();
            usleep(300000);

            if ($currentScore < $bestScore) {
                $bestScore = $currentScore;
                $bestPlots = KrsJadwalPlot::where('krs_period_id', $periodId)->get()->map(function($plot) {
                    return $plot->getAttributes();
                })->toArray();
            }

            if ($bestScore == 0) {
                break;
            }
        }

        // RESTORE BEST STATE
        // Daripada delete(), kita kembalikan statusnya
        foreach ($bestPlots as $bp) {
            KrsJadwalPlot::where('id', $bp['id'])->update([
                'hari' => $bp['hari'],
                'krs_ruang_id' => $bp['krs_ruang_id'],
                'krs_waktu_ids' => $bp['krs_waktu_ids'],
                'is_conflict' => $bp['is_conflict'],
                'conflict_message' => $bp['conflict_message']
            ]);
        }
        $this->validateConflicts($periodId);

        echo "data: " . json_encode(['done' => true, 'message' => "Proses selesai! Menyimpan hasil terbaik dengan $bestScore konflik."]) . "\n\n" . $pad;
        @ob_flush(); flush();
    }

    private function calculateScore($periodId, $batasanWaktu3)
    {
        $conflicts = KrsJadwalPlot::where('krs_period_id', $periodId)->where('is_conflict', true)->count();
        
        $overloads = 0;
        $rule3Active = $batasanWaktu3['aktif'] ?? true;
        if ($rule3Active) {
            $successes = KrsJadwalPlot::where('krs_period_id', $periodId)->where('is_conflict', false)->with('matakuliah')->get();
            $dailyLoad = [];
            foreach ($successes as $s) {
                if ($s->hari && $s->matakuliah) {
                    $divisor = $s->krs_dosen_kedua_id ? 2 : 1;
                    $addedSks = $s->matakuliah->sks / $divisor;
                    
                    if ($s->krs_dosen_id) {
                        if (!isset($dailyLoad[$s->hari][$s->krs_dosen_id])) {
                            $dailyLoad[$s->hari][$s->krs_dosen_id] = 0;
                        }
                        $dailyLoad[$s->hari][$s->krs_dosen_id] += $addedSks;
                    }
                    if ($s->krs_dosen_kedua_id) {
                        if (!isset($dailyLoad[$s->hari][$s->krs_dosen_kedua_id])) {
                            $dailyLoad[$s->hari][$s->krs_dosen_kedua_id] = 0;
                        }
                        $dailyLoad[$s->hari][$s->krs_dosen_kedua_id] += $addedSks;
                    }
                }
            }
            foreach ($successes as $s) {
                $isOverloaded = false;
                if ($s->hari) {
                    if ($s->krs_dosen_id && ($dailyLoad[$s->hari][$s->krs_dosen_id] ?? 0) > 6) {
                        $isOverloaded = true;
                    }
                    if ($s->krs_dosen_kedua_id && ($dailyLoad[$s->hari][$s->krs_dosen_kedua_id] ?? 0) > 6) {
                        $isOverloaded = true;
                    }
                }
                if ($isOverloaded) {
                    $overloads++;
                }
            }
        }

        return $conflicts + $overloads;
    }

    public function plotAuto($periodId, $batasanWaktu = null, $batasanWaktu2 = null, $batasanWaktu3 = null, $batasanRuangan = null)
    {
        $this->plotAutoCore($periodId, $batasanWaktu, $batasanWaktu2, $batasanWaktu3, $batasanRuangan, false);
    }

    public function plotAutoCore($periodId, $batasanWaktu = null, $batasanWaktu2 = null, $batasanWaktu3 = null, $batasanRuangan = null, $isRecreate = false)
    {
        $period = KrsPeriod::findOrFail($periodId);

        $ruleActive = $batasanWaktu['aktif'] ?? false;
        $ruleStartSlot = (int)($batasanWaktu['start_slot'] ?? 3);
        $ruleEndSlot = (int)($batasanWaktu['end_slot'] ?? 8);
        $ruleMkCodes = $batasanWaktu['kode_mps'] ?? [];

        $rule2Active = $batasanWaktu2['aktif'] ?? false;
        $rule2StartSlot = (int)($batasanWaktu2['start_slot'] ?? 1);
        $rule2EndSlot = (int)($batasanWaktu2['end_slot'] ?? 10);
        $rule2MkCodes = $batasanWaktu2['kode_mps'] ?? [];

        $rule3Active = $batasanWaktu3['aktif'] ?? true;

        $ruleAbaikanJenis = $batasanRuangan['abaikan_jenis'] ?? false;
        $ruleTanpaRuangan = $batasanRuangan['tanpa_ruangan'] ?? false;

        // Get all matakuliah for the period
        $matakuliahsRaw = KrsMatakuliah::where('krs_period_id', $periodId)
            ->orderBy('sks', 'desc')
            ->get();

        // SORTING CRITICAL FIX: 
        // We MUST plot the restricted MKs FIRST! Otherwise, non-restricted MKs 
        // will randomly steal the restricted time slots (e.g. jam 3-8) 
        // and cause the restricted MKs to fail.
        $matakuliahs = $matakuliahsRaw->sortByDesc(function ($mk) use ($ruleActive, $ruleMkCodes, $rule2Active, $rule2MkCodes) {
            // Sort keys: [is_restricted, sks]
            $isRestricted = ($ruleActive && in_array($mk->kode_mk, $ruleMkCodes)) ||
                ($rule2Active && in_array($mk->kode_mk, $rule2MkCodes));
            return ($isRestricted ? 1000 : 0) + $mk->sks;
        })->values();

        if ($isRecreate) {
            // Acak urutan matakuliah agar algoritma greedy mengambil path yang berbeda
            // Tetapi tetap prioritaskan mata kuliah yang restricted
            $matakuliahs = $matakuliahs->shuffle()->sortByDesc(function ($mk) use ($ruleActive, $ruleMkCodes, $rule2Active, $rule2MkCodes) {
                $isRestricted = ($ruleActive && in_array($mk->kode_mk, $ruleMkCodes)) || ($rule2Active && in_array($mk->kode_mk, $rule2MkCodes));
                return ($isRestricted ? 1000 : 0) + $mk->sks;
            })->values();
        }

        // Data that tracks current usage
        $dosenUsage = []; // dosen_id => used sks

        // Track room and time usage to avoid conflict
        // $roomUsage[hari][ruang_id][waktu_id] = true
        $roomUsage = [];
        // Track dosen time usage
        // $dosenTimeUsage[hari][dosen_id][waktu_id] = true
        $dosenTimeUsage = [];

        // Track global load for distribution (Pemerataan)
        $dayLoad = [];
        $roomLoad = [];

        // Preload existing plots to populate usage (if any remain)
        $existingPlots = KrsJadwalPlot::where('krs_period_id', $periodId)->with(['dosen', 'dosenKedua', 'matakuliah'])->get();
        foreach ($existingPlots as $plot) {
            // CACAT 3 FIX: Only preload usage if the plot is perfectly scheduled.
            // If it's a conflict or incomplete, plotAuto will REPLOT it, 
            // so we must NOT count its SKS/usage now, otherwise it double counts!
            if ($plot->is_conflict || !$plot->krs_waktu_ids || !$plot->krs_ruang_id) {
                continue;
            }

            $h = $plot->hari;
            if ($plot->matakuliah) {
                $divisor = $plot->krs_dosen_kedua_id ? 2 : 1;
                $addedSks = $plot->matakuliah->sks / $divisor;

                if ($plot->krs_dosen_id && $plot->dosen) {
                    $namaDosen = strtolower(trim($plot->dosen->nama_dosen));
                    if (!isset($dosenUsage[$namaDosen])) $dosenUsage[$namaDosen] = 0;
                    $dosenUsage[$namaDosen] += $addedSks;

                    if (!isset($dosenDailySks[$h][$namaDosen])) $dosenDailySks[$h][$namaDosen] = 0;
                    $dosenDailySks[$h][$namaDosen] += $addedSks;

                    if ($plot->krs_waktu_ids && $h) {
                        foreach ($plot->krs_waktu_ids as $wId) {
                            $dosenTimeUsage[$h][$namaDosen][$wId] = true;
                        }
                    }
                }
                
                if ($plot->krs_dosen_kedua_id && $plot->dosenKedua) {
                    $namaDosen2 = strtolower(trim($plot->dosenKedua->nama_dosen));
                    if (!isset($dosenUsage[$namaDosen2])) $dosenUsage[$namaDosen2] = 0;
                    $dosenUsage[$namaDosen2] += $addedSks;

                    if (!isset($dosenDailySks[$h][$namaDosen2])) $dosenDailySks[$h][$namaDosen2] = 0;
                    $dosenDailySks[$h][$namaDosen2] += $addedSks;

                    if ($plot->krs_waktu_ids && $h) {
                        foreach ($plot->krs_waktu_ids as $wId) {
                            $dosenTimeUsage[$h][$namaDosen2][$wId] = true;
                        }
                    }
                }
            }
            if ($plot->krs_ruang_id && $plot->krs_waktu_ids && $h) {
                foreach ($plot->krs_waktu_ids as $wId) {
                    $roomUsage[$h][$plot->krs_ruang_id][$wId] = true;
                }
            }
            if ($h) $dayLoad[$h] = ($dayLoad[$h] ?? 0) + 1;
            if ($plot->krs_ruang_id) $roomLoad[$plot->krs_ruang_id] = ($roomLoad[$plot->krs_ruang_id] ?? 0) + 1;
        }

        $waktus = KrsWaktu::where('krs_period_id', $periodId)
            ->orderBy('jam_mulai', 'asc')
            ->get();
        if ($waktus->isEmpty()) {
            throw new \Exception("Data waktu belum diisi/generate.");
        }

        $hariList = $period->hari_aktif && is_array($period->hari_aktif) && count($period->hari_aktif) > 0
            ? $period->hari_aktif
            : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

        $ruangs = KrsRuang::where('krs_period_id', $periodId)->get()
            ->filter(function ($ruang) {
                $nama = strtolower($ruang->nama_ruang);
                return !str_contains($nama, 'daring') && !str_contains($nama, 'online');
            });

        $dosens = KrsDosen::where('krs_period_id', $periodId)->get();

        foreach ($matakuliahs as $mk) {
            $isRestrictedRule1 = $ruleActive && in_array($mk->kode_mk, $ruleMkCodes);
            $isRestrictedRule2 = $rule2Active && in_array($mk->kode_mk, $rule2MkCodes);

            // Check if already plotted and
            $existingPlot = $existingPlots->firstWhere('krs_matakuliah_id', $mk->id);
            
            // Jika sudah ada jadwal yang valid (dianggap sebagai manual plot yang dikunci atau sudah well-plotted)
            if ($existingPlot && $existingPlot->hari && $existingPlot->krs_waktu_ids && $existingPlot->krs_ruang_id && !$existingPlot->is_conflict) {
                continue;
            }

            // Find eligible dosens for this MK (based on kode_mk and kelas)
            if ($existingPlot && $existingPlot->krs_dosen_id) {
                $eligibleDosens = $dosens->where('id', $existingPlot->krs_dosen_id);
            } else {
                $eligibleDosens = $dosens->where('kode_mk', $mk->kode_mk)->filter(function ($d) use ($mk) {
                    if (empty($d->kelas)) return true;
                    return strtolower(trim($d->kelas)) === strtolower(trim($mk->kelas));
                });
            }

            // Sort eligible dosens by current usage so we prioritize the one with least SKS
            $dosensList = $eligibleDosens->filter(function ($d) use ($dosenUsage, $mk) {
                $namaDosen = strtolower(trim($d->nama_dosen));
                $currentSks = $dosenUsage[$namaDosen] ?? 0;
                // Jika max_sks null atau 0 (Unlimit), maka lolos filter
                return empty($d->max_sks) || ($currentSks + $mk->sks) <= $d->max_sks;
            })->sortBy(function ($d) use ($dosenUsage) {
                $namaDosen = strtolower(trim($d->nama_dosen));
                return $dosenUsage[$namaDosen] ?? 0;
            })->values();

            $targetSlots = $mk->sks; // 1 SKS = 1 Slot (JP)
            $selectedWaktuIds = [];
            $selectedRuang = null;
            $selectedHari = null;
            $isConflict = false;
            $conflictMsg = [];
            $selectedDosen = ($existingPlot && $existingPlot->krs_dosen_id) ? KrsDosen::find($existingPlot->krs_dosen_id) : null;
            $selectedDosenKedua = ($existingPlot && $existingPlot->krs_dosen_kedua_id) ? KrsDosen::find($existingPlot->krs_dosen_kedua_id) : null;

            if ($dosensList->isEmpty()) {
                $isConflict = true;
                $conflictMsg[] = "Tidak ada pendidik utama yang tersedia atau semua melebihi beban maksimal.";
            }

            $reasonNoContinuousTime = true;
            $reasonRoomFull = false;
            $foundTime = false;

            // ============================================================
            // SLOT FILL SCORING + ANTI-OVERLOAD (2-Pass)
            // Pass 1: Strict anti-overload (dosen max 6 SKS/hari jika Rule3 aktif)
            // Pass 2: Relaxed (boleh overload jika tidak ada pilihan lain)
            // Scoring: pilih blok jam yang paling mengisi hari (sisa paling kecil)
            // ============================================================
            for ($pass = 1; $pass <= 2; $pass++) {
                if ($foundTime) break;

                foreach ($dosensList as $dosen) {
                    if ($foundTime) break;

                    $namaDosen = strtolower(trim($dosen->nama_dosen));

                    $namaDosenKedua = $selectedDosenKedua ? strtolower(trim($selectedDosenKedua->nama_dosen)) : null;

                    // Kumpulkan semua kandidat blok slot yang valid dari semua hari
                    // Format: [ ['hari'=>.., 'block'=>[ids..], 'score'=>..], ... ]
                    $candidates = [];

                    foreach ($hariList as $hari) {

                        // PASS 1 STRICT: Tolak hari yang akan membuat dosen overload
                        if ($pass === 1 && $rule3Active) {
                            $divisor = $selectedDosenKedua ? 2 : 1;
                            $addedSks = $mk->sks / $divisor;
                            $currentDailySks = $dosenDailySks[$hari][$namaDosen] ?? 0;
                            if (($currentDailySks + $addedSks) > 6) {
                                continue; // Dosen akan overload di hari ini, lewati
                            }
                            if ($namaDosenKedua) {
                                $currentDailySks2 = $dosenDailySks[$hari][$namaDosenKedua] ?? 0;
                                if (($currentDailySks2 + $addedSks) > 6) {
                                    continue; 
                                }
                            }
                        }

                        // Hitung total waktu yang sudah terpakai di hari ini (semua ruang, semua dosen)
                        $totalSlotsInDay = count($waktus);
                        $slotsTakenInDay = 0;
                        foreach ($waktus as $w) {
                            // Cek apakah slot ini sudah penuh (semua ruang dipakai)
                            // Slot dianggap "terisi" jika dosen ini sudah di slot tsb
                            if (isset($dosenTimeUsage[$hari][$namaDosen][$w->id])) {
                                $slotsTakenInDay++;
                            } elseif ($namaDosenKedua && isset($dosenTimeUsage[$hari][$namaDosenKedua][$w->id])) {
                                $slotsTakenInDay++;
                            }
                        }

                        // Iterasi semua possible starting position
                        for ($i = 0; $i < count($waktus); $i++) {
                            $startSlotNum = $i + 1;
                            $endSlotNum   = $startSlotNum + $targetSlots - 1;

                            // Terapkan Restriction Rule 1
                            if ($isRestrictedRule1) {
                                if ($startSlotNum < $ruleStartSlot || $endSlotNum > $ruleEndSlot) {
                                    continue;
                                }
                            }
                            // Terapkan Restriction Rule 2
                            if ($isRestrictedRule2) {
                                if ($startSlotNum < $rule2StartSlot || $endSlotNum > $rule2EndSlot) {
                                    continue;
                                }
                            }

                            // Coba bangun blok kontinu sebanyak $targetSlots dari posisi $i
                            $blockIds = [];
                            for ($j = $i; $j < count($waktus); $j++) {
                                $w = $waktus[$j];

                                // Jumatan: skip slot istirahat Jumat
                                if ($hari === 'Jumat' && $w->jam_mulai <= '12:19:00' && $w->jam_selesai >= '11:41:00') {
                                    break;
                                }
                                // Dosen sibuk di slot ini
                                if (isset($dosenTimeUsage[$hari][$namaDosen][$w->id])) {
                                    break;
                                }
                                if ($namaDosenKedua && isset($dosenTimeUsage[$hari][$namaDosenKedua][$w->id])) {
                                    break;
                                }

                                $blockIds[] = $w->id;

                                if (count($blockIds) === $targetSlots) {
                                    $reasonNoContinuousTime = false;

                                    // Cek apakah ada ruang yang cocok untuk blok ini
                                    $sortedRuangs = [...$ruangs];
                                    usort($sortedRuangs, fn($a, $b) => ($roomLoad[$a->id] ?? 0) <=> ($roomLoad[$b->id] ?? 0));

                                    $roomForBlock = null;

                                    if ($ruleTanpaRuangan) {
                                        // Fake room object so it passes the check below
                                        $roomForBlock = (object)['id' => null, 'nama_ruang' => 'Tanpa Ruangan'];
                                    } else {
                                        foreach ($sortedRuangs as $ruang) {
                                            if (!$ruleAbaikanJenis && !empty($mk->jenis_ruang)) {
                                                if (strtolower(trim($ruang->kapasitas)) !== strtolower(trim($mk->jenis_ruang))) {
                                                    continue;
                                                }
                                            }
                                            $roomAvailable = true;
                                            foreach ($blockIds as $bwId) {
                                                if (isset($roomUsage[$hari][$ruang->id][$bwId])) {
                                                    $roomAvailable = false;
                                                    break;
                                                }
                                            }
                                            if ($roomAvailable) {
                                                $roomForBlock = $ruang;
                                                break;
                                            }
                                        }
                                    }

                                    if ($roomForBlock) {
                                        // ── SLOT FILL SCORING ──────────────────────────────────
                                        // Hitung sisa slot di hari ini setelah blok ini diletakkan.
                                        // Skor terbaik = sisa paling kecil (blok mengisi penuh hari).
                                        // Kita juga reward blok yang mulai lebih awal (compact packing).
                                        // Sisa slot = slot bebas DOSEN di hari ini SEBELUM ditambah blok ini
                                        // dikurangi SKS yang baru saja diletakkan.
                                        $freeSlotsBeforeFill = $totalSlotsInDay - $slotsTakenInDay;
                                        $remainAfterFill     = $freeSlotsBeforeFill - $targetSlots;
                                        // Bonus kecil untuk starting slot lebih awal agar compact
                                        $score = $remainAfterFill * 100 + $i;
                                        $candidates[] = [
                                            'hari'   => $hari,
                                            'block'  => $blockIds,
                                            'ruang'  => $roomForBlock,
                                            'dosen'  => $dosen,
                                            'score'  => $score,
                                        ];
                                    } else {
                                        $reasonRoomFull = true;
                                    }
                                    break; // Sudah dapat blok penuh, lanjut ke starting pos berikutnya
                                }
                            }
                        }
                    }

                    if (!empty($candidates)) {
                        // Pilih kandidat dengan score terkecil (sisa slot paling kecil = paling efisien)
                        usort($candidates, fn($a, $b) => $a['score'] <=> $b['score']);
                        $best = $candidates[0];

                        $selectedHari      = $best['hari'];
                        $selectedWaktuIds  = $best['block'];
                        $selectedRuang     = $best['ruang'];
                        $selectedDosen     = $best['dosen'];
                        $foundTime         = true;
                    }
                }
            }

            if (!$foundTime && $dosensList->isNotEmpty()) {
                $isConflict = true;
                if ($reasonNoContinuousTime) {
                    $conflictMsg[] = "Semua pendidik yang tersedia tidak memiliki sisa jadwal kosong berurutan sebanyak {$mk->sks} SKS berturut-turut.";
                } else if ($reasonRoomFull) {
                    $conflictMsg[] = "Dosen tersedia, namun semua Ruangan penuh pada jam tersebut.";
                } else {
                    $conflictMsg[] = "Waktu/Ruang tidak tersedia.";
                }

                // Set to the best attempted dosen even if failed, so the manual plot knows who was attempted
                $selectedDosen = $dosensList->first();
            }

            if ($existingPlot) {
                $existingPlot->update([
                    'krs_dosen_id' => $selectedDosen?->id,
                    'krs_dosen_kedua_id' => $selectedDosenKedua?->id,
                    'krs_ruang_id' => $selectedRuang?->id,
                    'hari' => $selectedHari,
                    'krs_waktu_ids' => $selectedWaktuIds ?: null,
                    'is_conflict' => $isConflict,
                    'conflict_message' => implode(' | ', $conflictMsg),
                ]);
            } else {
                KrsJadwalPlot::create([
                    'krs_period_id' => $periodId,
                    'krs_matakuliah_id' => $mk->id,
                    'krs_dosen_id' => $selectedDosen?->id,
                    'krs_dosen_kedua_id' => $selectedDosenKedua?->id,
                    'krs_ruang_id' => $selectedRuang?->id,
                    'hari' => $selectedHari,
                    'krs_waktu_ids' => $selectedWaktuIds ?: null,
                    'is_conflict' => $isConflict,
                    'conflict_message' => implode(' | ', $conflictMsg),
                ]);
            }

            // Update usage trackers
            $divisor = $selectedDosenKedua ? 2 : 1;
            $addedSks = $mk->sks / $divisor;

            if ($selectedDosen) {
                $namaDosen = strtolower(trim($selectedDosen->nama_dosen));
                if (!isset($dosenUsage[$namaDosen])) $dosenUsage[$namaDosen] = 0;
                $dosenUsage[$namaDosen] += $addedSks;

                if (!$isConflict && $selectedRuang && !empty($selectedWaktuIds) && $selectedHari) {
                    if (!isset($dosenDailySks[$selectedHari][$namaDosen])) $dosenDailySks[$selectedHari][$namaDosen] = 0;
                    $dosenDailySks[$selectedHari][$namaDosen] += $addedSks;

                    foreach ($selectedWaktuIds as $wId) {
                        $dosenTimeUsage[$selectedHari][$namaDosen][$wId] = true;
                        $roomUsage[$selectedHari][$selectedRuang->id][$wId] = true;

                        $dayLoad[$selectedHari] = ($dayLoad[$selectedHari] ?? 0) + 1;
                        $roomLoad[$selectedRuang->id] = ($roomLoad[$selectedRuang->id] ?? 0) + 1;
                    }
                }
            }
            if ($selectedDosenKedua) {
                $namaDosenKedua = strtolower(trim($selectedDosenKedua->nama_dosen));
                if (!isset($dosenUsage[$namaDosenKedua])) $dosenUsage[$namaDosenKedua] = 0;
                $dosenUsage[$namaDosenKedua] += $addedSks;

                if (!$isConflict && $selectedRuang && !empty($selectedWaktuIds) && $selectedHari) {
                    if (!isset($dosenDailySks[$selectedHari][$namaDosenKedua])) $dosenDailySks[$selectedHari][$namaDosenKedua] = 0;
                    $dosenDailySks[$selectedHari][$namaDosenKedua] += $addedSks;

                    foreach ($selectedWaktuIds as $wId) {
                        $dosenTimeUsage[$selectedHari][$namaDosenKedua][$wId] = true;
                    }
                }
            }
        }

        // Ensure all conflicts (including manual ones) are correctly tagged
        $this->validateConflicts($periodId);
    }

    public function validateConflicts($periodId)
    {
        $plots = KrsJadwalPlot::where('krs_period_id', $periodId)->with('dosen')->get();

        $roomUsage = [];
        $dosenUsage = [];

        // Build usage map
        foreach ($plots as $plot) {
            if (!$plot->hari || !$plot->krs_waktu_ids) continue;

            foreach ($plot->krs_waktu_ids as $wId) {
                if ($plot->krs_ruang_id) {
                    $roomUsage[$plot->hari][$plot->krs_ruang_id][$wId][] = $plot->id;
                }
                if ($plot->krs_dosen_id && $plot->dosen) {
                    $namaDosen = strtolower(trim($plot->dosen->nama_dosen));
                    $dosenUsage[$plot->hari][$namaDosen][$wId][] = $plot->id;
                }
                if ($plot->krs_dosen_kedua_id && $plot->dosenKedua) {
                    $namaDosenKedua = strtolower(trim($plot->dosenKedua->nama_dosen));
                    $dosenUsage[$plot->hari][$namaDosenKedua][$wId][] = $plot->id;
                }
            }
        }

        // Validate
        foreach ($plots as $plot) {
            $isCompletelyEmpty = !$plot->krs_dosen_id && !$plot->krs_ruang_id && !$plot->hari && empty($plot->krs_waktu_ids);

            $hasSpecificError = $plot->conflict_message && (
                strpos($plot->conflict_message, 'Dosen (') !== false ||
                strpos($plot->conflict_message, 'melebihi beban') !== false ||
                strpos($plot->conflict_message, 'Ruangan penuh') !== false ||
                strpos($plot->conflict_message, 'Waktu/Ruang tidak tersedia') !== false
            );

            if ($isCompletelyEmpty && !$hasSpecificError) {
                $plot->update([
                    'is_conflict' => false,
                    'conflict_message' => null
                ]);
                continue;
            }

            $isConflict = false;
            $msgs = [];

            if (!$plot->krs_dosen_id) {
                $isConflict = true;
                if ($plot->conflict_message && strpos($plot->conflict_message, 'melebihi beban maksimal') !== false) {
                    $msgs[] = $plot->conflict_message;
                } else if ($plot->conflict_message && strpos($plot->conflict_message, 'pendidik utama yang tersedia') !== false) {
                    $msgs[] = $plot->conflict_message;
                } else {
                    $msgs[] = "Dosen belum diatur.";
                }
            }
            if (!$plot->krs_ruang_id && $plot->krs_dosen_id) {
                $isConflict = true;
                if ($plot->conflict_message && strpos($plot->conflict_message, 'semua Ruangan penuh') !== false) {
                    $msgs[] = $plot->conflict_message;
                } else {
                    $msgs[] = "Ruang belum diatur.";
                }
            }
            if (!$plot->hari || empty($plot->krs_waktu_ids)) {
                $isConflict = true;
                if ($plot->conflict_message && strpos($plot->conflict_message, 'kosong berurutan') !== false) {
                    $msgs[] = $plot->conflict_message;
                } else if (!in_array("Ruang belum diatur.", $msgs) && !in_array($plot->conflict_message, $msgs)) {
                    $msgs[] = "Waktu belum diatur.";
                }
            }

            if ($plot->hari && $plot->krs_waktu_ids) {
                $roomConflict = false;
                $dosenConflict = false;

                foreach ($plot->krs_waktu_ids as $wId) {
                    if ($plot->krs_ruang_id) {
                        $users = $roomUsage[$plot->hari][$plot->krs_ruang_id][$wId] ?? [];
                        if (count($users) > 1) {
                            $roomConflict = true;
                        }
                    }
                    if ($plot->krs_dosen_id && $plot->dosen) {
                        $namaDosen = strtolower(trim($plot->dosen->nama_dosen));
                        $users = $dosenUsage[$plot->hari][$namaDosen][$wId] ?? [];
                        if (count($users) > 1) {
                            $dosenConflict = true;
                        }
                    }
                    if ($plot->krs_dosen_kedua_id && $plot->dosenKedua) {
                        $namaDosenKedua = strtolower(trim($plot->dosenKedua->nama_dosen));
                        $users = $dosenUsage[$plot->hari][$namaDosenKedua][$wId] ?? [];
                        if (count($users) > 1) {
                            $dosenConflict = true;
                        }
                    }
                }

                if ($roomConflict) {
                    $isConflict = true;
                    $msgs[] = "Bentrok Ruangan.";
                }
                if ($dosenConflict) {
                    $isConflict = true;
                    $msgs[] = "Bentrok Jadwal Dosen.";
                }
            }

            $plot->update([
                'is_conflict' => $isConflict,
                'conflict_message' => empty($msgs) ? null : implode(' | ', $msgs)
            ]);
        }
    }
}
