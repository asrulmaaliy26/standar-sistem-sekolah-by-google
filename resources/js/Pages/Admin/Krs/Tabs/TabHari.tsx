import React from 'react';
import { Trash2, Edit, Plus, Lock } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Plot {
    id: number;
    krs_matakuliah_id: number;
    krs_dosen_id: number | null;
    krs_ruang_id: number | null;
    krs_waktu_ids: number[] | null;
    hari: string | null;
    is_conflict: boolean;
    is_locked: boolean;
    conflict_message: string | null;
    conflict_group_id?: number | null;
    matakuliah: { kode_mk: string; nama_mk: string; kelas: string; sks: number; jenis_ruang: string | null };
    dosen?: { id: number; nama_dosen: string };
    dosen_kedua?: { id: number; nama_dosen: string };
    krs_dosen_kedua_id?: number | null;
    ruang?: { id: number; nama_ruang: string; kapasitas: string | null };
    waktu_details?: { id: number; hari: string; jam_mulai: string; jam_selesai: string }[];
}

interface TabHariProps {
    plots: Plot[];
    waktus?: any[];
    ruangs?: any[];
    setEditPlot: (plot: any) => void;
    setEditData: (data: any) => void;
    setEditTimes: (times: string[]) => void;
}

export default function TabHari({
    plots, waktus = [], ruangs = [], setEditPlot, setEditData, setEditTimes
}: TabHariProps) {
    const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu', 'Belum Diplot'];
    
    const groups = new Map();
    daysOrder.forEach(day => {
        groups.set(day, {
            hari: day,
            plots: [],
            totalSks: 0,
        });
    });

    plots?.forEach((p: Plot) => {
        const day = p.hari || 'Belum Diplot';
        if (!groups.has(day)) {
            groups.set(day, {
                hari: day,
                plots: [],
                totalSks: 0,
            });
        }
        const g = groups.get(day);
        g.plots.push(p);
        const divisor = p.krs_dosen_kedua_id ? 2 : 1;
        g.totalSks += (p.matakuliah.sks / divisor);
    });

    const resetPlot = (plotId: number) => {
        router.post(
            route('admin.krs.jadwal.update', plotId),
            {
                krs_dosen_id: '',
                krs_ruang_id: '',
                krs_waktu_ids: [],
                hari: '',
            },
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <div className="space-y-6">
            {Array.from(groups.values()).map((g) => {
                if (g.plots.length === 0) return null;
                
                // Get unique room IDs in this day
                const uniqueRoomIds = Array.from(new Set(g.plots.map((p: Plot) => p.krs_ruang_id)));
                // Sort room IDs to ensure consistent order (unassigned at bottom)
                uniqueRoomIds.sort((a, b) => {
                    if (a === null) return 1;
                    if (b === null) return -1;
                    const rA = ruangs.find(r => r.id === a)?.nama_ruang || '';
                    const rB = ruangs.find(r => r.id === b)?.nama_ruang || '';
                    return rA.localeCompare(rB);
                });

                return (
                    <div key={g.hari} className="border-border overflow-hidden rounded-xl border">
                        <div className="bg-indigo-50 border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50 flex items-center justify-between border-b p-4">
                            <div>
                                <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{g.hari}</h3>
                                <p className="text-indigo-600/80 dark:text-indigo-400/80 font-medium text-sm mt-1">
                                    <span className="bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded mr-2">Total SKS: {g.totalSks} SKS</span>
                                    <span className="bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded">Total Kelas: {g.plots.length}</span>
                                </p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/30 text-muted-foreground uppercase">
                                    <tr>
                                        <th className="p-3 font-semibold">Kode</th>
                                        <th className="p-3 font-semibold">Mata Kuliah</th>
                                        <th className="p-3 font-semibold">Kelas</th>
                                        <th className="p-3 font-semibold">SKS</th>
                                        <th className="p-3 font-semibold">Pendidik</th>
                                        <th className="p-3 font-semibold">Waktu & Ruang</th>
                                        <th className="p-3 text-center font-semibold">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {uniqueRoomIds.map(roomId => {
                                        const roomPlots = g.plots.filter((p: Plot) => p.krs_ruang_id === roomId);
                                        const roomObj = ruangs.find(r => r.id === roomId);
                                        const roomName = roomObj?.nama_ruang || 'Belum Ditentukan';
                                        
                                        const renderedRows: React.ReactNode[] = [];
                                        
                                        // Header row for room
                                        renderedRows.push(
                                            <tr key={`header-${roomId || 'none'}`} className="bg-slate-100 dark:bg-slate-800/50">
                                                <td colSpan={7} className="p-2 px-4 text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-border shadow-sm">
                                                    📍 Ruangan: <span className="text-primary">{roomName}</span>
                                                </td>
                                            </tr>
                                        );

                                        // If no roomId (unassigned), just render plots directly
                                        if (roomId === null || g.hari === 'Belum Diplot') {
                                            roomPlots.forEach((p: Plot) => {
                                                renderedRows.push(
                                                    <tr key={`plot-${p.id}`} className="border-border hover:bg-muted/30 border-b last:border-0">
                                                        <td className="p-3 font-medium">{p.matakuliah.kode_mk}</td>
                                                        <td className="p-3">{p.matakuliah.nama_mk} ({p.matakuliah.sks} SKS)</td>
                                                        <td className="p-3">{p.matakuliah.kelas}</td>
                                                        <td className="p-3">{p.matakuliah.sks}</td>
                                                        <td className="p-3">
                                                            {p.dosen?.nama_dosen || <span className="text-muted-foreground italic">Belum ditentukan</span>}
                                                            {p.dosen_kedua && <div className="text-xs text-muted-foreground mt-1">Pendamping: {p.dosen_kedua.nama_dosen}</div>}
                                                        </td>
                                                        <td className="p-3">
                                                            <span className="text-muted-foreground text-xs italic">Belum diplot dengan lengkap</span>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditPlot(p);
                                                                        setEditData({
                                                                            krs_dosen_id: p.krs_dosen_id?.toString() || '',
                                                                            krs_dosen_kedua_id: p.krs_dosen_kedua_id?.toString() || '',
                                                                            krs_ruang_id: p.krs_ruang_id?.toString() || '',
                                                                            krs_waktu_ids: p.krs_waktu_ids || [],
                                                                            hari: p.hari || 'Senin',
                                                                        });
                                                                        setEditTimes([]);
                                                                    }}
                                                                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                            return renderedRows;
                                        }

                                        // For assigned rooms, calculate empty slots using waktus
                                        let currentPlotId: number | null = null;
                                        let currentWaktuStart: any = null;
                                        let currentWaktuEnd: any = null;
                                        let isKosong = false;

                                        const pushRow = () => {
                                            if (currentWaktuStart) {
                                                const timeStr = `${currentWaktuStart.jam_mulai.slice(0, 5)} - ${currentWaktuEnd.jam_selesai.slice(0, 5)}`;
                                                if (isKosong) {
                                                    renderedRows.push(
                                                        <tr key={`kosong-${currentWaktuStart.id}`} className="border-border border-b border-dashed bg-emerald-50/30 dark:bg-emerald-950/10">
                                                            <td className="p-3"></td>
                                                            <td className="p-3"></td>
                                                            <td className="p-3"></td>
                                                            <td className="p-3"></td>
                                                            <td className="p-3"></td>
                                                            <td className="p-3 align-top whitespace-nowrap font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                                {timeStr} (KOSONG)
                                                            </td>
                                                            <td className="p-3 align-top text-center">
                                                                <button
                                                                    onClick={() => {
                                                                        // Fill slot logic can be added here if needed
                                                                    }}
                                                                    className="rounded bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                                                                    title="Slot Kosong"
                                                                >
                                                                    <Plus className="h-4 w-4" opacity={0} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                } else {
                                                    const plot = roomPlots.find((p: Plot) => p.id === currentPlotId);
                                                    if (plot) {
                                                        renderedRows.push(
                                                            <tr key={`plot-${plot.id}`} className="border-border hover:bg-muted/30 border-b last:border-0">
                                                                <td className="p-3 font-medium">{plot.matakuliah.kode_mk}</td>
                                                                <td className="p-3">{plot.matakuliah.nama_mk} ({plot.matakuliah.sks} SKS)</td>
                                                                <td className="p-3">{plot.matakuliah.kelas}</td>
                                                                <td className="p-3">{plot.matakuliah.sks}</td>
                                                                <td className="p-3">
                                                                    {plot.dosen?.nama_dosen || <span className="text-muted-foreground italic">Belum ditentukan</span>}
                                                                    {plot.dosen_kedua && <div className="text-xs text-muted-foreground mt-1">Pendamping: {plot.dosen_kedua.nama_dosen}</div>}
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold">
                                                                        {g.hari}, {timeStr}
                                                                        <span className="text-muted-foreground ml-1 font-normal">
                                                                            ({roomName})
                                                                        </span>
                                                                    </span>
                                                                    {plot.is_locked && (
                                                                        <span className="ml-2 inline-flex items-center text-amber-500 text-xs font-medium" title="Diplot Manual (Terkunci)">
                                                                            <Lock className="h-3 w-3 mr-1" /> Terkunci
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditPlot(plot);
                                                                                setEditData({
                                                                                    krs_dosen_id: plot.krs_dosen_id?.toString() || '',
                                                                                    krs_dosen_kedua_id: plot.krs_dosen_kedua_id?.toString() || '',
                                                                                    krs_ruang_id: plot.krs_ruang_id?.toString() || '',
                                                                                    krs_waktu_ids: plot.krs_waktu_ids || [],
                                                                                    hari: plot.hari || 'Senin',
                                                                                });
                                                                                if (plot.waktu_details && plot.waktu_details.length > 0) {
                                                                                    setEditTimes(
                                                                                        plot.waktu_details.map(
                                                                                            (w: any) => `${w.jam_mulai} - ${w.jam_selesai}`
                                                                                        )
                                                                                    );
                                                                                } else {
                                                                                    setEditTimes([]);
                                                                                }
                                                                            }}
                                                                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                if (confirm(`Yakin ingin mereset jadwal kelas ${plot.matakuliah.nama_mk} (${plot.matakuliah.kelas})? Ruangan dan waktu akan dikosongkan.`)) {
                                                                                    resetPlot(plot.id);
                                                                                }
                                                                            }}
                                                                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }
                                                }
                                            }
                                        };

                                        waktus.forEach((w: any) => {
                                            const plotForWaktu = roomPlots.find((p: Plot) => p.krs_waktu_ids?.includes(w.id));
                                            
                                            if (plotForWaktu) {
                                                if (isKosong || currentPlotId !== plotForWaktu.id) {
                                                    pushRow();
                                                    currentPlotId = plotForWaktu.id;
                                                    currentWaktuStart = w;
                                                    currentWaktuEnd = w;
                                                    isKosong = false;
                                                } else {
                                                    currentWaktuEnd = w;
                                                }
                                            } else {
                                                if (!isKosong) {
                                                    pushRow();
                                                    currentPlotId = null;
                                                    currentWaktuStart = w;
                                                    currentWaktuEnd = w;
                                                    isKosong = true;
                                                } else {
                                                    currentWaktuEnd = w;
                                                }
                                            }
                                        });
                                        pushRow(); // push the last accumulated block

                                        return renderedRows;
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
