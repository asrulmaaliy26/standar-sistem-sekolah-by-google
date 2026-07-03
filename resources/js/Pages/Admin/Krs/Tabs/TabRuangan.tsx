import React from 'react';
import { createPortal } from 'react-dom';
import { Edit, Plus, Lock, Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Plot {
    id: number;
    krs_matakuliah_id: number;
    krs_dosen_id: number | null;
    krs_dosen_kedua_id: number | null;
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
    ruang?: { id: number; nama_ruang: string; kapasitas: string | null };
    waktu_details?: { id: number; hari: string; jam_mulai: string; jam_selesai: string }[];
}

interface TabRuanganProps {
    ruangs: any[];
    plots: Plot[];
    waktus: any[];
    setEditPlot: (plot: any) => void;
    setEditData: (data: any) => void;
    setEditTimes: (times: string[]) => void;
}

export default function TabRuangan({
    ruangs, plots, waktus, setEditPlot, setEditData, setEditTimes
}: TabRuanganProps) {
    const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    
    const [selectPlotModal, setSelectPlotModal] = React.useState<{ruangId: number, hari: string, waktu: any} | null>(null);
    const [searchQuery, setSearchQuery] = React.useState('');
    
    return (
        <>
        <div className="space-y-6">
            {ruangs?.map((ruang: any) => {
                const plotsInRuang = plots.filter(p => p.krs_ruang_id === ruang.id);
                
                return (
                    <div key={ruang.id} className="overflow-x-auto border rounded-xl shadow-sm bg-white dark:bg-slate-900 border-border">
                        <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b border-border text-center font-bold sticky left-0 z-20">
                            {ruang.nama_ruang} <span className="text-sm font-normal text-muted-foreground">(Kapasitas: {ruang.kapasitas || '-'})</span>
                        </div>
                        <table className="w-full text-sm border-collapse text-center">
                            <thead>
                                <tr>
                                    <th className="border border-slate-300 dark:border-slate-700 p-2 bg-slate-200 dark:bg-slate-800 sticky top-0 left-0 z-10 font-bold whitespace-nowrap min-w-[50px]">Jam Ke</th>
                                    <th className="border border-slate-300 dark:border-slate-700 p-2 bg-slate-200 dark:bg-slate-800 sticky top-0 left-[50px] z-10 font-bold whitespace-nowrap min-w-[100px]">Waktu</th>
                                    {hariList.map(hari => (
                                        <th key={hari} className="border border-slate-300 dark:border-slate-700 p-2 bg-slate-200 dark:bg-slate-800 font-bold min-w-[150px]">
                                            {hari}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {waktus.map((w, index) => {
                                    if (w.is_istirahat) {
                                        return (
                                            <tr key={`istirahat-${w.id}`} className="hover:bg-red-50 dark:hover:bg-red-900/20">
                                                <td className="border border-slate-300 dark:border-slate-700 p-2 font-medium bg-red-50 dark:bg-red-950/20 sticky left-0 z-10 text-red-600 dark:text-red-400">{index + 1}</td>
                                                <td className="border border-slate-300 dark:border-slate-700 p-2 font-medium bg-red-50 dark:bg-red-950/20 sticky left-[50px] z-10 text-red-600 dark:text-red-400">{w.jam_mulai.slice(0, 5)} - {w.jam_selesai.slice(0, 5)}</td>
                                                <td colSpan={hariList.length} className="border border-slate-300 dark:border-slate-700 p-2 text-center text-red-600 dark:text-red-400 font-bold tracking-widest text-sm uppercase bg-red-50 dark:bg-red-950/20">
                                                    ISTIRAHAT
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="border border-slate-300 dark:border-slate-700 p-2 font-medium bg-slate-100 dark:bg-slate-800/80 sticky left-0 z-10">{index + 1}</td>
                                            <td className="border border-slate-300 dark:border-slate-700 p-2 font-medium bg-slate-100 dark:bg-slate-800/80 sticky left-[50px] z-10">{w.jam_mulai.slice(0, 5)} - {w.jam_selesai.slice(0, 5)}</td>
                                            {hariList.map(hari => {
                                                // Find ALL plots for this room, on this day, at this time
                                                const cellPlots = plotsInRuang.filter((p: Plot) => p.hari === hari && p.krs_waktu_ids?.includes(w.id));

                                                return (
                                                    <td
                                                        key={hari}
                                                        className={`border border-slate-300 dark:border-slate-700 p-1.5 align-middle transition-colors ${cellPlots.length === 0 ? 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30 cursor-pointer group' : ''} h-full`}
                                                        onClick={() => {
                                                            if (cellPlots.length === 0) {
                                                                setSelectPlotModal({
                                                                    ruangId: ruang.id,
                                                                    hari: hari,
                                                                    waktu: w
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        {cellPlots.length === 0 ? (
                                                            <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity h-full min-h-[30px]">
                                                                <div className="rounded-full bg-emerald-100 p-1 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                                                                    <Plus className="h-4 w-4" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-0.5 w-full h-full">
                                                                {cellPlots.map((plot, pIndex) => {
                                                                    let dosenName = plot.dosen?.nama_dosen || 'No Dosen';
                                                                    if (plot.dosen_kedua) dosenName += ` & ${plot.dosen_kedua.nama_dosen}`;
                                                                    
                                                                    let bgColorClass = 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40';
                                                                    let conflictClass = 'border-transparent';
                                                                    
                                                                    if (plot.is_conflict) {
                                                                        conflictClass = 'text-red-600 font-bold border-red-500 border-2 dark:text-red-400';
                                                                        bgColorClass = 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40';
                                                                    }
                                                    
                                                                    return (
                                                                        <div 
                                                                            key={plot.id || pIndex}
                                                                            className={`flex flex-col items-center justify-center text-[10px] leading-tight relative w-full px-1 py-0.5 cursor-pointer rounded border ${bgColorClass} ${conflictClass} group`}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setEditPlot(plot);
                                                                                setEditData({
                                                                                    krs_dosen_id: plot.krs_dosen_id?.toString() || '',
                                                                                    krs_dosen_kedua_id: plot.krs_dosen_kedua_id?.toString() || '',
                                                                                    krs_ruang_id: plot.krs_ruang_id?.toString() || '',
                                                                                    krs_waktu_ids: plot.krs_waktu_ids || [],
                                                                                    hari: plot.hari || hari,
                                                                                    is_locked: plot.is_locked || false,
                                                                                });
                                                                                if (plot.waktu_details && plot.waktu_details.length > 0) {
                                                                                    setEditTimes(plot.waktu_details.map((wd: any) => `${wd.jam_mulai} - ${wd.jam_selesai}`));
                                                                                } else {
                                                                                    setEditTimes([]);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <div className="font-semibold whitespace-normal text-center flex items-center gap-1 justify-center relative z-0">
                                                                                {plot.matakuliah.nama_mk} ({plot.matakuliah.kelas})
                                                                                {plot.is_locked && <Lock className="h-2.5 w-2.5 text-amber-500" title="Terkunci" />}
                                                                            </div>
                                                                            <div className="text-[8.5px] text-muted-foreground mt-0 text-center relative z-0">{dosenName}</div>
                                                                            
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (confirm(`Yakin ingin menghapus / mereset plot kelas ${plot.matakuliah.nama_mk} (${plot.matakuliah.kelas})?`)) {
                                                                                        // @ts-ignore
                                                                                        router.put(route('admin.krs.plot.update', plot.id), {
                                                                                            krs_dosen_id: plot.krs_dosen_id,
                                                                                            krs_dosen_kedua_id: plot.krs_dosen_kedua_id,
                                                                                            krs_ruang_id: null,
                                                                                            hari: null,
                                                                                            krs_waktu_ids: [],
                                                                                            is_locked: false,
                                                                                        }, { preserveScroll: true });
                                                                                    }
                                                                                }}
                                                                                className="absolute top-0.5 left-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 z-10 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900"
                                                                                title="Reset Jadwal"
                                                                            >
                                                                                <Trash2 className="h-2.5 w-2.5" />
                                                                            </button>
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
            
            {selectPlotModal && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
                    <div className="bg-card text-card-foreground border-border relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border p-6 shadow-2xl">
                        <h3 className="mb-4 text-xl font-bold">Pilih Kelas untuk Diplot</h3>
                        
                        <input 
                            type="text" 
                            placeholder="Cari Mata Kuliah / Dosen..." 
                            className="w-full border p-2 mb-4 rounded bg-background"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[60vh]">
                            {plots
                                .filter(p => !p.krs_waktu_ids || p.krs_waktu_ids.length === 0)
                                .filter(p => p.matakuliah.nama_mk.toLowerCase().includes(searchQuery.toLowerCase()) || (p.dosen && p.dosen.nama_dosen.toLowerCase().includes(searchQuery.toLowerCase())))
                                .map(plot => (
                                    <div key={plot.id} className="p-3 border border-border rounded-lg hover:bg-muted cursor-pointer flex justify-between items-center transition-colors"
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
                                            <div className="font-bold">{plot.matakuliah.kode_mk} - {plot.matakuliah.nama_mk} (Kelas {plot.matakuliah.kelas})</div>
                                            <div className="text-sm text-muted-foreground mt-1">Pendidik: {plot.dosen?.nama_dosen || 'Belum Ditentukan'} | SKS: {plot.matakuliah.sks} | Kapasitas: {plot.matakuliah.jenis_ruang}</div>
                                        </div>
                                        <div>
                                            <button className="rounded bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                <Plus className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            
                            {plots.filter(p => !p.krs_waktu_ids || p.krs_waktu_ids.length === 0).length === 0 && (
                                <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">Semua kelas sudah terplot ke dalam jadwal.</div>
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
                document.body
            )}
        </>
    );
}
