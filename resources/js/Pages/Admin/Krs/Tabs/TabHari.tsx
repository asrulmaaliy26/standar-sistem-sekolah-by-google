import { router } from '@inertiajs/react';
import { Edit, Lock, Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

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

export default function TabHari({ plots, waktus = [], ruangs = [], setEditPlot, setEditData, setEditTimes }: TabHariProps) {
    const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu', 'Belum Diplot'];

    const [selectPlotModal, setSelectPlotModal] = React.useState<{ ruangId: number; hari: string; waktu: any } | null>(null);
    const [searchQuery, setSearchQuery] = React.useState('');

    const groups = new Map();
    daysOrder.forEach((day) => {
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
        g.totalSks += p.matakuliah.sks / divisor;
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
        <>
            <div className="space-y-6">
                {Array.from(groups.values()).map((g) => {
                    if (g.plots.length === 0) return null;

                    // Get unique room IDs in this day
                    const uniqueRoomIds = Array.from(new Set(g.plots.map((p: Plot) => p.krs_ruang_id)));
                    // Sort room IDs to ensure consistent order (unassigned at bottom)
                    uniqueRoomIds.sort((a, b) => {
                        if (a === null) return 1;
                        if (b === null) return -1;
                        const rA = ruangs.find((r) => r.id === a)?.nama_ruang || '';
                        const rB = ruangs.find((r) => r.id === b)?.nama_ruang || '';
                        return rA.localeCompare(rB);
                    });

                    return (
                        <div key={g.hari} className="border-border overflow-hidden rounded-xl border">
                            <div className="flex items-center justify-between border-b border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                                <div>
                                    <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{g.hari}</h3>
                                    <p className="mt-1 text-sm font-medium text-indigo-600/80 dark:text-indigo-400/80">
                                        <span className="mr-2 rounded bg-indigo-100 px-2 py-0.5 dark:bg-indigo-900/50">
                                            Total SKS: {g.totalSks} SKS
                                        </span>
                                        <span className="rounded bg-indigo-100 px-2 py-0.5 dark:bg-indigo-900/50">Total Kelas: {g.plots.length}</span>
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
                                        {uniqueRoomIds.map((roomId) => {
                                            const roomPlots = g.plots.filter((p: Plot) => p.krs_ruang_id === roomId);
                                            const roomObj = ruangs.find((r) => r.id === roomId);
                                            const roomName = roomObj?.nama_ruang || 'Belum Ditentukan';

                                            const renderedRows: React.ReactNode[] = [];

                                            // Header row for room
                                            renderedRows.push(
                                                <tr key={`header-${roomId || 'none'}`} className="bg-slate-100 dark:bg-slate-800/50">
                                                    <td
                                                        colSpan={7}
                                                        className="border-border border-b p-2 px-4 text-sm font-bold text-slate-700 shadow-sm dark:text-slate-300"
                                                    >
                                                        📍 Ruangan: <span className="text-primary">{roomName}</span>
                                                    </td>
                                                </tr>,
                                            );

                                            // If no roomId (unassigned), just render plots directly
                                            if (roomId === null || g.hari === 'Belum Diplot') {
                                                roomPlots.forEach((p: Plot) => {
                                                    renderedRows.push(
                                                        <tr key={`plot-${p.id}`} className="border-border hover:bg-muted/30 border-b last:border-0">
                                                            <td className="p-3 font-medium">{p.matakuliah.kode_mk}</td>
                                                            <td className="p-3">
                                                                {p.matakuliah.nama_mk} ({p.matakuliah.sks} SKS)
                                                            </td>
                                                            <td className="p-3">{p.matakuliah.kelas}</td>
                                                            <td className="p-3">{p.matakuliah.sks}</td>
                                                            <td className="p-3">
                                                                {p.dosen?.nama_dosen || (
                                                                    <span className="text-muted-foreground italic">Belum ditentukan</span>
                                                                )}
                                                                {p.dosen_kedua && (
                                                                    <div className="text-muted-foreground mt-1 text-xs">
                                                                        Pendamping: {p.dosen_kedua.nama_dosen}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="p-3">
                                                                <span className="text-muted-foreground text-xs italic">
                                                                    Belum diplot dengan lengkap
                                                                </span>
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
                                                                                is_locked: p.is_locked || false,
                                                                            });
                                                                            setEditTimes([]);
                                                                        }}
                                                                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>,
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
                                                    const capturedStart = currentWaktuStart;
                                                    const capturedEnd = currentWaktuEnd;
                                                    const timeStr = `${capturedStart.jam_mulai.slice(0, 5)} - ${capturedEnd.jam_selesai.slice(0, 5)}`;
                                                    if (isKosong) {
                                                        renderedRows.push(
                                                            <tr
                                                                key={`kosong-${capturedStart.id}`}
                                                                className="border-border border-b border-dashed bg-emerald-50/30 dark:bg-emerald-950/10"
                                                            >
                                                                <td className="p-3"></td>
                                                                <td className="p-3"></td>
                                                                <td className="p-3"></td>
                                                                <td className="p-3"></td>
                                                                <td className="p-3"></td>
                                                                <td className="flex items-center gap-2 p-3 align-top font-semibold whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                                                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                                                    {timeStr} (KOSONG)
                                                                </td>
                                                                <td className="p-3 text-center align-top">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            if (roomId) {
                                                                                setSelectPlotModal({
                                                                                    ruangId: roomId,
                                                                                    hari: g.hari,
                                                                                    waktu: capturedStart,
                                                                                });
                                                                            }
                                                                        }}
                                                                        className="rounded bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 relative z-10"
                                                                        title="Isi Slot Kosong"
                                                                    >
                                                                        <Plus className="h-4 w-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>,
                                                        );
                                                    } else {
                                                        const plot = roomPlots.find((p: Plot) => p.id === currentPlotId);
                                                        if (plot) {
                                                            renderedRows.push(
                                                                <tr
                                                                    key={`plot-${plot.id}`}
                                                                    className="border-border hover:bg-muted/30 border-b last:border-0"
                                                                >
                                                                    <td className="p-3 font-medium">{plot.matakuliah.kode_mk}</td>
                                                                    <td className="p-3">
                                                                        {plot.matakuliah.nama_mk} ({plot.matakuliah.sks} SKS)
                                                                    </td>
                                                                    <td className="p-3">{plot.matakuliah.kelas}</td>
                                                                    <td className="p-3">{plot.matakuliah.sks}</td>
                                                                    <td className="p-3">
                                                                        {plot.dosen?.nama_dosen || (
                                                                            <span className="text-muted-foreground italic">Belum ditentukan</span>
                                                                        )}
                                                                        {plot.dosen_kedua && (
                                                                            <div className="text-muted-foreground mt-1 text-xs">
                                                                                Pendamping: {plot.dosen_kedua.nama_dosen}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold">
                                                                            {g.hari}, {timeStr}
                                                                            <span className="text-muted-foreground ml-1 font-normal">
                                                                                ({roomName})
                                                                            </span>
                                                                        </span>
                                                                        {plot.is_locked && (
                                                                            <span
                                                                                className="ml-2 inline-flex items-center text-xs font-medium text-amber-500"
                                                                                title="Diplot Manual (Terkunci)"
                                                                            >
                                                                                <Lock className="mr-1 h-3 w-3" /> Terkunci
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
                                                                                                (w: any) => `${w.jam_mulai} - ${w.jam_selesai}`,
                                                                                            ),
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
                                                                                    if (
                                                                                        confirm(
                                                                                            `Yakin ingin mereset jadwal kelas ${plot.matakuliah.nama_mk} (${plot.matakuliah.kelas})? Ruangan dan waktu akan dikosongkan.`,
                                                                                        )
                                                                                    ) {
                                                                                        resetPlot(plot.id);
                                                                                    }
                                                                                }}
                                                                                className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>,
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

            {selectPlotModal &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
                        <div className="bg-card text-card-foreground border-border relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border p-6 shadow-2xl">
                            <h3 className="mb-4 text-xl font-bold">Pilih Kelas untuk Diplot</h3>

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
                                                setEditPlot(plot);
                                                setEditData({
                                                    krs_dosen_id: plot.krs_dosen_id?.toString() || '',
                                                    krs_dosen_kedua_id: plot.krs_dosen_kedua_id?.toString() || '',
                                                    krs_ruang_id: selectPlotModal.ruangId.toString(),
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
                                {plots.filter((p) => !p.krs_waktu_ids || p.krs_waktu_ids.length === 0).length === 0 && (
                                    <div className="text-muted-foreground p-4 text-center">Tidak ada kelas yang belum diplot.</div>
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
