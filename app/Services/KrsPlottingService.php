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
    public function plotAuto($periodId)
    {
        $period = KrsPeriod::findOrFail($periodId);
        // Get all matakuliah for the period
        // CACAT 1 FIX: Sort by SKS desc so large blocks are plotted first
        $matakuliahs = KrsMatakuliah::where('krs_period_id', $periodId)
            ->orderBy('sks', 'desc')
            ->get();

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
        $existingPlots = KrsJadwalPlot::where('krs_period_id', $periodId)->get();
        foreach ($existingPlots as $plot) {
            // CACAT 3 FIX: Only preload usage if the plot is perfectly scheduled.
            // If it's a conflict or incomplete, plotAuto will REPLOT it, 
            // so we must NOT count its SKS/usage now, otherwise it double counts!
            if ($plot->is_conflict || !$plot->krs_waktu_ids || !$plot->krs_ruang_id) {
                continue;
            }

            $h = $plot->hari;
            if ($plot->krs_dosen_id) {
                if (!isset($dosenUsage[$plot->krs_dosen_id])) $dosenUsage[$plot->krs_dosen_id] = 0;
                $dosenUsage[$plot->krs_dosen_id] += $plot->matakuliah->sks;
                
                if ($plot->krs_waktu_ids && $h) {
                    foreach ($plot->krs_waktu_ids as $wId) {
                        $dosenTimeUsage[$h][$plot->krs_dosen_id][$wId] = true;
                    }
                }
            }
            if ($plot->krs_ruang_id && $plot->krs_waktu_ids && $h) {
                foreach ($plot->krs_waktu_ids as $wId) {
                    $roomUsage[$h][$plot->krs_ruang_id][$wId] = true;
                    $roomLoad[$plot->krs_ruang_id] = ($roomLoad[$plot->krs_ruang_id] ?? 0) + 1;
                }
            }
            if ($h && $plot->krs_waktu_ids) {
                $dayLoad[$h] = ($dayLoad[$h] ?? 0) + count($plot->krs_waktu_ids);
            }
        }

        $waktus = KrsWaktu::where('krs_period_id', $periodId)
            ->orderBy('jam_mulai')
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

        foreach ($matakuliahs as $mk) {
            // Check if already plotted and NOT in conflict
            $existingPlot = KrsJadwalPlot::where('krs_matakuliah_id', $mk->id)->first();
            if ($existingPlot && !$existingPlot->is_conflict && $existingPlot->krs_waktu_ids && $existingPlot->krs_ruang_id) {
                continue; // Skip already well-plotted
            }

            // Find eligible dosens for this MK (based on kode_mk)
            $eligibleDosens = KrsDosen::where('krs_period_id', $periodId)
                ->where('kode_mk', $mk->kode_mk)
                ->get()
                ->sortBy('prioritas'); // Sort by prioritas so if SKS is equal, priority wins

            // Sort eligible dosens by current usage so we prioritize the one with least SKS
            $dosensList = $eligibleDosens->filter(function($d) use ($dosenUsage, $mk) {
                $currentSks = $dosenUsage[$d->id] ?? 0;
                return $d->max_sks === null || ($currentSks + $mk->sks) <= $d->max_sks;
            })->sortBy(function($d) use ($dosenUsage) {
                return $dosenUsage[$d->id] ?? 0;
            })->values();

            $targetSlots = $mk->sks; // 1 SKS = 1 Slot (JP)
            $selectedWaktuIds = [];
            $selectedRuang = null;
            $selectedHari = null;
            $isConflict = false;
            $conflictMsg = [];
            $selectedDosen = null;

            if ($dosensList->isEmpty()) {
                $isConflict = true;
                $conflictMsg[] = "Tidak ada pendidik yang tersedia atau semua melebihi beban maksimal.";
            }

            $reasonNoContinuousTime = true;
            $reasonRoomFull = false;
            $foundTime = false;

            // Sort days by least usage (Pemerataan Hari)
            $sortedHariList = $hariList;
            usort($sortedHariList, fn($a, $b) => ($dayLoad[$a] ?? 0) <=> ($dayLoad[$b] ?? 0));

            // CACAT 2 FIX: Fallback Dosen loop
            foreach ($dosensList as $dosen) {
                if ($foundTime) break;
                
                foreach ($sortedHariList as $hari) {
                    if ($foundTime) break;
                    
                    for ($i = 0; $i < count($waktus); $i++) {
                        $currentBlockIds = [];
                        
                        for ($j = $i; $j < count($waktus); $j++) {
                            $w = $waktus[$j];
                            
                            // Check if dosen is available at this time
                            if (isset($dosenTimeUsage[$hari][$dosen->id][$w->id])) {
                                break; // Dosen is busy, break the continuous block
                            }

                            $currentBlockIds[] = $w->id;

                            if (count($currentBlockIds) == $targetSlots) {
                                $reasonNoContinuousTime = false; // Found a block where dosen is free
                                
                                // Sort rooms by least usage (Pemerataan Ruang)
                                $sortedRuangs = [...$ruangs];
                                usort($sortedRuangs, fn($a, $b) => ($roomLoad[$a->id] ?? 0) <=> ($roomLoad[$b->id] ?? 0));
                                
                                // Find a room available for all these time blocks
                                $foundRoom = false;
                                foreach ($sortedRuangs as $ruang) {
                                    $roomAvailable = true;
                                    foreach ($currentBlockIds as $bwId) {
                                        if (isset($roomUsage[$hari][$ruang->id][$bwId])) {
                                            $roomAvailable = false;
                                            break;
                                        }
                                    }
                                    
                                    if ($roomAvailable) {
                                        $selectedRuang = $ruang;
                                        $selectedWaktuIds = $currentBlockIds;
                                        $selectedHari = $hari;
                                        $selectedDosen = $dosen;
                                        $foundTime = true;
                                        $foundRoom = true;
                                        break;
                                    }
                                }
                                if (!$foundRoom) {
                                    $reasonRoomFull = true;
                                }
                                break; // Target reached (either room found or all rooms full for this block)
                            }
                        }
                        if ($foundTime) break;
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
                    'krs_ruang_id' => $selectedRuang?->id,
                    'hari' => $selectedHari,
                    'krs_waktu_ids' => $selectedWaktuIds ?: null,
                    'is_conflict' => $isConflict,
                    'conflict_message' => implode(' | ', $conflictMsg),
                ]);
            }

            // Update usage trackers
            if ($selectedDosen) {
                if (!isset($dosenUsage[$selectedDosen->id])) {
                    $dosenUsage[$selectedDosen->id] = 0;
                }
                $dosenUsage[$selectedDosen->id] += $mk->sks; // INCREMENT LOAD!
                
                if (!$isConflict && $selectedRuang && !empty($selectedWaktuIds) && $selectedHari) {
                    foreach ($selectedWaktuIds as $wId) {
                        $dosenTimeUsage[$selectedHari][$selectedDosen->id][$wId] = true;
                        $roomUsage[$selectedHari][$selectedRuang->id][$wId] = true;
                        
                        $dayLoad[$selectedHari] = ($dayLoad[$selectedHari] ?? 0) + 1;
                        $roomLoad[$selectedRuang->id] = ($roomLoad[$selectedRuang->id] ?? 0) + 1;
                    }
                }
            }
        }
        
        // Ensure all conflicts (including manual ones) are correctly tagged
        $this->validateConflicts($periodId);
    }

    public function validateConflicts($periodId)
    {
        $plots = KrsJadwalPlot::where('krs_period_id', $periodId)->get();
        
        $roomUsage = [];
        $dosenUsage = [];

        // Build usage map
        foreach ($plots as $plot) {
            if (!$plot->hari || !$plot->krs_waktu_ids) continue;
            
            foreach ($plot->krs_waktu_ids as $wId) {
                if ($plot->krs_ruang_id) {
                    $roomUsage[$plot->hari][$plot->krs_ruang_id][$wId][] = $plot->id;
                }
                if ($plot->krs_dosen_id) {
                    $dosenUsage[$plot->hari][$plot->krs_dosen_id][$wId][] = $plot->id;
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
                    if ($plot->krs_dosen_id) {
                        $users = $dosenUsage[$plot->hari][$plot->krs_dosen_id][$wId] ?? [];
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
