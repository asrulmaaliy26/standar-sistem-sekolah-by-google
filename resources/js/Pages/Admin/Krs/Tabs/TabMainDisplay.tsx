import React, { useState } from 'react';
import { Plus, Lock, AlertTriangle, Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import { createPortal } from 'react-dom';

interface Plot {
    id: number;
    krs_matakuliah_id: number;
    krs_dosen_id: number | null;
    krs_ruang_id: number | null;
    krs_waktu_ids: number[] | null;
    hari: string | null;
    is_conflict: boolean;
    conflict_message: string | null;
    matakuliah: { kode_mk: string; nama_mk: string; kelas: string; sks: number; jenis_ruang: string | null };
    dosen?: { id: number; nama_dosen: string };
    ruang?: { id: number; nama_ruang: string; kapasitas: string | null };
    waktu_details?: { id: number; hari: string; jam_mulai: string; jam_selesai: string }[];
}

interface TabMainDisplayProps {
    plots: Plot[];
    waktus: any[];
    rule3Active?: boolean;
    setEditPlot: (plot: any) => void;
    setEditData: (data: any) => void;
    setEditTimes: (times: string[]) => void;
}

export default function TabMainDisplay({ plots, waktus = [], rule3Active = true, setEditPlot, setEditData, setEditTimes }: TabMainDisplayProps) {
    const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const [selectPlotModal, setSelectPlotModal] = useState<{ hari: string; waktu: any; ruang: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Extract unique rooms from plots
    const uniqueRuangs = Array.from(new Set(plots.map(p => p.ruang?.nama_ruang).filter(Boolean))).sort();

    // Precalculate dosen load per day for overload checking
    const dosenDailyLoad: Record<string, Record<number, number>> = {};
    plots.forEach(p => {
        if (p.hari) {
            if (!dosenDailyLoad[p.hari]) dosenDailyLoad[p.hari] = {};
            const sks = Number(p.matakuliah.sks) || 0;
            
            if (p.krs_dosen_id) {
                dosenDailyLoad[p.hari][p.krs_dosen_id] = (dosenDailyLoad[p.hari][p.krs_dosen_id] || 0) + sks;
            }
            if (p.krs_dosen_kedua_id) {
                dosenDailyLoad[p.hari][p.krs_dosen_kedua_id] = (dosenDailyLoad[p.hari][p.krs_dosen_kedua_id] || 0) + sks;
            }
        }
    });

    // Extract unique rooms using the existing uniqueRuangs definition at line 36
    // uniqueClasses is no longer used for columns

    return (
        <>
            <div className="space-y-8">
                {daysOrder.map((day) => {
                    const plotsInDay = plots.filter((p) => p.hari === day);

                    return (
                        <div key={day} className="overflow-x-auto border rounded-xl shadow-sm bg-white dark:bg-slate-900 border-border">
                            <table className="w-full text-center text-xs whitespace-nowrap">
                                <thead>
                                    <tr>
                                        <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 bg-emerald-200 dark:bg-emerald-900 p-2 font-bold uppercase w-16">JAM KE</th>
                                        <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 bg-emerald-200 dark:bg-emerald-900 p-2 font-bold uppercase w-32">WAKTU</th>
                                        <th colSpan={uniqueRuangs.length} className="border border-slate-300 dark:border-slate-700 bg-emerald-300 dark:bg-emerald-800 p-2 font-bold uppercase tracking-widest text-sm text-center">
                                            {day}
                                        </th>
                                </tr>
                                <tr>
                                    {uniqueRuangs.map((ruangan) => (
                                        <th key={ruangan} className="border border-slate-300 dark:border-slate-700 bg-emerald-200 dark:bg-emerald-900 p-2 font-bold">
                                            {ruangan}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {waktus.map((w, index) => {
                                    if (w.is_istirahat) {
                                        return (
                                            <tr key={w.id} className="bg-amber-100 dark:bg-amber-900/50">
                                                <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{index + 1}</td>
                                                <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{w.jam_mulai.slice(0, 5)} - {w.jam_selesai.slice(0, 5)}</td>
                                                <td colSpan={uniqueRuangs.length} className="border border-slate-300 dark:border-slate-700 p-2 font-bold tracking-widest text-amber-800 dark:text-amber-300 uppercase">
                                                    ISTIRAHAT
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="border border-slate-300 dark:border-slate-700 p-2 font-medium bg-slate-100 dark:bg-slate-800/80">{index + 1}</td>
                                            <td className="border border-slate-300 dark:border-slate-700 p-2 font-medium bg-slate-100 dark:bg-slate-800/80">{w.jam_mulai.slice(0, 5)} - {w.jam_selesai.slice(0, 5)}</td>
                                            {uniqueRuangs.map((ruangan) => {
                                                const cellPlots = plotsInDay.filter((p) => p.ruang?.nama_ruang === ruangan && p.krs_waktu_ids?.includes(w.id));
                                                
                                                return (
                                                    <td
                                                        key={ruangan}
                                                        className={`border border-slate-300 dark:border-slate-700 p-0 align-top transition-colors ${cellPlots.length === 0 ? 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30 cursor-pointer group' : ''}`}
                                                        onClick={() => {
                                                            if (cellPlots.length === 0) {
                                                                setSelectPlotModal({
                                                                    hari: day,
                                                                    waktu: w,
                                                                    ruang: ruangan as string
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        {cellPlots.length === 0 ? (
                                                            <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity h-full min-h-[40px] p-1.5">
                                                                <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-row h-full w-full">
                                                                {cellPlots.map((plot, i) => {
                                                                    const isOverload = Boolean(plot.hari && (rule3Active ?? true) && (
                                                                        (plot.krs_dosen_id && dosenDailyLoad[plot.hari] && dosenDailyLoad[plot.hari][plot.krs_dosen_id] > 6) ||
                                                                        (plot.krs_dosen_kedua_id && dosenDailyLoad[plot.hari] && dosenDailyLoad[plot.hari][plot.krs_dosen_kedua_id] > 6)
                                                                    ));
                                                                    
                                                                    let bgColorClass = 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40';
                                                                    let conflictClass = '';
                                                                    if (plot.is_conflict) {
                                                                        conflictClass = 'text-red-600 font-bold dark:text-red-400';
                                                                        bgColorClass = 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50';
                                                                    } else if (isOverload) {
                                                                        conflictClass = 'text-amber-700 font-bold dark:text-amber-400';
                                                                        bgColorClass = 'bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60';
                                                                    }

                                                                    return (
                                                                        <div 
                                                                            key={plot.id} 
                                                                            className={`flex-1 flex flex-col p-1.5 relative cursor-pointer group transition-colors min-h-[40px] ${bgColorClass} ${conflictClass} ${i !== cellPlots.length - 1 ? 'border-r border-slate-300 dark:border-slate-700' : ''}`}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setEditPlot(plot);
                                                                                setEditData({
                                                                                    krs_dosen_id: plot.krs_dosen_id?.toString() || '',
                                                                                    krs_dosen_kedua_id: plot.krs_dosen_kedua_id?.toString() || '',
                                                                                    krs_ruang_id: plot.krs_ruang_id?.toString() || '',
                                                                                    krs_waktu_ids: plot.krs_waktu_ids || [],
                                                                                    hari: plot.hari || day,
                                                                                    is_locked: plot.is_locked || false,
                                                                                });
                                                                                if (plot.waktu_details && plot.waktu_details.length > 0) {
                                                                                    setEditTimes(plot.waktu_details.map((wd: any) => `${wd.jam_mulai} - ${wd.jam_selesai}`));
                                                                                } else {
                                                                                    setEditTimes([]);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <div className="flex flex-col items-center justify-center text-[10px] leading-tight relative w-full h-full">
                                                                                {/* Conflict tooltip badge */}
                                                                                {plot.is_conflict && (() => {
                                                                                    const msg = plot.conflict_message || '';
                                                                                    const isRuangConflict = msg.toLowerCase().includes('ruang');
                                                                                    const isDosenConflict = msg.toLowerCase().includes('dosen') || msg.toLowerCase().includes('pendidik') || msg.toLowerCase().includes('guru');
                                                                                    const conflictTypeLabel = isRuangConflict ? '🏫 Bentrok Ruang' : isDosenConflict ? '👤 Bentrok Pendidik' : '⚠️ Konflik';
                                                                                    return (
                                                                                        <div className="absolute -top-1 -right-1 z-20 group/tooltip">
                                                                                            <div className="text-red-500 bg-white dark:bg-slate-900 rounded-full shadow cursor-help">
                                                                                                <AlertTriangle className="h-3.5 w-3.5 fill-red-100" />
                                                                                            </div>
                                                                                            <div className="hidden group-hover/tooltip:block absolute right-0 top-4 z-50 w-64 rounded-lg border border-red-300 bg-white dark:bg-slate-900 shadow-xl p-3 text-left text-[10px] pointer-events-none">
                                                                                                <div className="font-bold text-red-600 dark:text-red-400 text-xs mb-1.5 flex items-center gap-1">
                                                                                                    <AlertTriangle className="h-3 w-3" />
                                                                                                    {conflictTypeLabel}
                                                                                                </div>
                                                                                                <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-normal">
                                                                                                    {msg || 'Terdapat konflik jadwal pada slot ini.'}
                                                                                                </div>
                                                                                                <div className="mt-2 pt-2 border-t border-red-100 dark:border-red-900 text-slate-500 dark:text-slate-400">
                                                                                                    <span className="font-semibold">Mapel:</span> {plot.matakuliah.nama_mk} ({plot.matakuliah.kelas})<br/>
                                                                                                    {plot.dosen && <><span className="font-semibold">Pendidik:</span> {plot.dosen.nama_dosen}<br/></>}
                                                                                                    {plot.ruang && <><span className="font-semibold">Ruang:</span> {plot.ruang.nama_ruang}</>}
                                                                                                </div>
                                                                                                <div className="mt-1 text-[9px] text-red-500 dark:text-red-400 italic">
                                                                                                    Klik kartu untuk edit & pindahkan jadwal ini.
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                                {/* Overload tooltip badge */}
                                                                                {!plot.is_conflict && isOverload && (
                                                                                    <div className="absolute -top-1 -right-1 z-20 group/tooltip">
                                                                                        <div className="text-amber-500 bg-white dark:bg-slate-900 rounded-full shadow cursor-help">
                                                                                            <AlertTriangle className="h-3.5 w-3.5 fill-amber-100" />
                                                                                        </div>
                                                                                        <div className="hidden group-hover/tooltip:block absolute right-0 top-4 z-50 w-56 rounded-lg border border-amber-300 bg-white dark:bg-slate-900 shadow-xl p-3 text-left text-[10px] pointer-events-none">
                                                                                            <div className="font-bold text-amber-700 dark:text-amber-400 text-xs mb-1.5 flex items-center gap-1">
                                                                                                <AlertTriangle className="h-3 w-3" />
                                                                                                ⚡ Overload Pendidik
                                                                                            </div>
                                                                                            <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                                                                                Beban <span className="font-semibold">{plot.dosen?.nama_dosen}</span> pada hari <span className="font-semibold">{plot.hari}</span> melebihi batas <span className="font-semibold">6 SKS/Hari</span>.
                                                                                            </div>
                                                                                            <div className="mt-1 text-[9px] text-amber-600 dark:text-amber-400 italic">
                                                                                                Pertimbangkan memindahkan ke hari lain.
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                <div className="font-bold whitespace-normal text-center flex items-center gap-1 justify-center relative z-0">
                                                                                    {plot.matakuliah.nama_mk} ({plot.matakuliah.kelas})
                                                                                    {(plot as any).is_locked && <Lock className="h-3 w-3 text-amber-500" title="Terkunci" />}
                                                                                </div>
                                                                                <div className="text-[9px] text-muted-foreground mt-0.5 text-center relative z-0">
                                                                                    {plot.dosen?.nama_dosen && (
                                                                                        <>
                                                                                            {plot.dosen.nama_dosen}
                                                                                            {(plot as any).dosen_kedua && ` & ${(plot as any).dosen_kedua.nama_dosen}`}
                                                                                            <br/>
                                                                                        </>
                                                                                    )}
                                                                                    {plot.ruang?.nama_ruang || '-'}
                                                                                </div>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (confirm(`Yakin ingin menghapus / mereset plot kelas ${plot.matakuliah.nama_mk} (${plot.matakuliah.kelas})?`)) {
                                                                                            // @ts-ignore
                                                                                            router.put(route('admin.krs.plot.update', plot.id), {
                                                                                                krs_dosen_id: plot.krs_dosen_id,
                                                                                                krs_dosen_kedua_id: (plot as any).krs_dosen_kedua_id,
                                                                                                krs_ruang_id: null,
                                                                                                hari: null,
                                                                                                krs_waktu_ids: [],
                                                                                                is_locked: false,
                                                                                            }, { preserveScroll: true });
                                                                                        }
                                                                                    }}
                                                                                    className="absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 z-10 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900"
                                                                                    title="Reset Jadwal"
                                                                                >
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                            </div>
                        );
                    })}
                </div>

            {selectPlotModal &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
                        <div className="bg-card text-card-foreground border-border relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border p-6 shadow-2xl">
                            <h3 className="mb-4 text-xl font-bold">Pilih Kelas untuk Diplot ({selectPlotModal.ruang})</h3>

                            <input
                                type="text"
                                placeholder="Cari Mata Kuliah / Dosen..."
                                className="bg-background mb-4 w-full rounded border p-2"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            <div className="max-h-[60vh] flex-1 space-y-2 overflow-y-auto pr-2">
                                {plots
                                    .filter((p) => !p.krs_waktu_ids || p.krs_waktu_ids.length === 0)
                                    .filter(
                                        (p) =>
                                            p.matakuliah.nama_mk.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            (p.dosen && p.dosen.nama_dosen.toLowerCase().includes(searchQuery.toLowerCase())),
                                    )
                                    .map((plot) => (
                                        <div
                                            key={plot.id}
                                            className="border-border hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors"
                                            onClick={() => {
                                                const selectedRoomPlot = plots.find(p => p.ruang?.nama_ruang === selectPlotModal.ruang);
                                                const roomIdStr = selectedRoomPlot?.ruang?.id?.toString() || '';
                                                
                                                setEditPlot(plot);
                                                setEditData({
                                                    krs_dosen_id: plot.krs_dosen_id?.toString() || '',
                                                    krs_dosen_kedua_id: plot.krs_dosen_kedua_id?.toString() || '',
                                                    krs_ruang_id: roomIdStr,
                                                    hari: selectPlotModal.hari,
                                                    krs_waktu_ids: [],
                                                    is_locked: false,
                                                });
                                                const timeStr = `${selectPlotModal.waktu.jam_mulai.slice(0, 5)} - ${selectPlotModal.waktu.jam_selesai.slice(0, 5)}`;
                                                setEditTimes([timeStr]);
                                                setSelectPlotModal(null);
                                                setSearchQuery('');
                                            }}
                                        >
                                            <div>
                                                <div className="font-bold">
                                                    {plot.matakuliah.kode_mk} - {plot.matakuliah.nama_mk} (Kelas {plot.matakuliah.kelas})
                                                </div>
                                                <div className="text-muted-foreground text-sm">
                                                    {plot.matakuliah.sks} SKS • Dosen: {plot.dosen?.nama_dosen || 'Belum diplot'}
                                                </div>
                                            </div>
                                            <Plus className="text-primary h-5 w-5" />
                                        </div>
                                    ))}
                                {plots
                                    .filter((p) => !p.krs_waktu_ids || p.krs_waktu_ids.length === 0).length === 0 && (
                                    <div className="text-muted-foreground p-4 text-center">Semua kelas sudah terplot ke dalam jadwal.</div>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => {
                                        setSelectPlotModal(null);
                                        setSearchQuery('');
                                    }}
                                    className="rounded bg-slate-200 px-4 py-2 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
}
