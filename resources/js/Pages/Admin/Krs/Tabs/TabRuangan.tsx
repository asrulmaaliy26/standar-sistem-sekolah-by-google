import React from 'react';
import { createPortal } from 'react-dom';
import { Edit, Plus, Lock } from 'lucide-react';

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
                return (
                    <div key={ruang.id} className="bg-card text-card-foreground border-border overflow-hidden rounded-xl border shadow-sm">
                        <div className="bg-muted/30 border-border flex flex-col items-start justify-between gap-2 border-b px-4 py-3 md:flex-row md:items-center">
                            <h3 className="text-lg font-bold">{ruang.nama_ruang} <span className="text-sm font-normal text-muted-foreground">(Kapasitas: {ruang.kapasitas})</span></h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground border-border border-b">
                                    <tr>
                                        <th className="p-3 w-32">Hari</th>
                                        <th className="p-3 w-48">Waktu</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3 w-16 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hariList.map(hari => {
                                        const dayPlots = plots.filter((p: Plot) => p.krs_ruang_id === ruang.id && p.hari === hari && !p.is_conflict);
                                        
                                        let rows: React.ReactNode[] = [];
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
                                                    rows.push(
                                                        <tr key={`kosong-${capturedStart.id}`} className="border-border border-b border-dashed bg-emerald-50/30 dark:bg-emerald-950/10">
                                                            <td className="p-3 font-medium align-top">{rows.length === 0 ? hari : ''}</td>
                                                            <td className="p-3 align-top whitespace-nowrap text-muted-foreground">{timeStr}</td>
                                                            <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> KOSONG
                                                            </td>
                                                            <td className="p-3 align-top text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setSelectPlotModal({
                                                                            ruangId: ruang.id,
                                                                            hari: hari,
                                                                            waktu: capturedStart
                                                                        });
                                                                    }}
                                                                    className="rounded bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 relative z-10"
                                                                    title="Isi Slot Kosong"
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                } else {
                                                    const plot = dayPlots.find((p: Plot) => p.id === currentPlotId);
                                                    if (plot) {
                                                        let dosenName = plot.dosen ? plot.dosen.nama_dosen : 'Belum Ditentukan';
                                                        if (plot.dosen_kedua) {
                                                            dosenName += ` & ${plot.dosen_kedua.nama_dosen}`;
                                                        }
                                                        rows.push(
                                                            <tr key={`isi-${plot.id}-${currentWaktuStart.id}`} className="border-border border-b">
                                                                <td className="p-3 font-medium align-top">{rows.length === 0 ? hari : ''}</td>
                                                                <td className="p-3 align-top whitespace-nowrap text-muted-foreground">{timeStr}</td>
                                                                <td className="p-3">
                                                                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                                                        {plot.matakuliah.nama_mk} - {plot.matakuliah.kelas} ({plot.matakuliah.sks} SKS)
                                                                        {plot.is_locked && <Lock className="h-3 w-3 text-amber-600" />}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">{dosenName}</div>
                                                                </td>
                                                                <td className="p-3 align-top text-center">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditPlot(plot);
                                                                            setEditData({
                                                                                krs_dosen_id: plot.krs_dosen_id?.toString() || '',
                                                                                krs_dosen_kedua_id: plot.krs_dosen_kedua_id?.toString() || '',
                                                                                krs_ruang_id: plot.krs_ruang_id?.toString() || '',
                                                                                hari: plot.hari || 'Senin',
                                                                                krs_waktu_ids: plot.krs_waktu_ids || [],
                                                                                is_locked: plot.is_locked || false,
                                                                            });
                                                                            if (plot.waktu_details && plot.waktu_details.length > 0) {
                                                                                setEditTimes(
                                                                                    plot.waktu_details.map((w: any) => `${w.jam_mulai} - ${w.jam_selesai}`),
                                                                                );
                                                                            } else {
                                                                                setEditTimes([]);
                                                                            }
                                                                        }}
                                                                        className="rounded bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                                                                        title="Edit Plot"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }
                                                }
                                            }
                                        };

                                        waktus.forEach((w: any) => {
                                            const plotForWaktu = dayPlots.find((p: Plot) => p.krs_waktu_ids?.includes(w.id));
                                            
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
                                        pushRow();

                                        if (rows.length === 0) return null;
                                        
                                        return <React.Fragment key={hari}>{rows}</React.Fragment>;
                                    })}
                                </tbody>
                            </table>
                        </div>
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
