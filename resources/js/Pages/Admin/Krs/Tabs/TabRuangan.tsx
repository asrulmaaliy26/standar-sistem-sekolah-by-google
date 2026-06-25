import React from 'react';
import { Edit } from 'lucide-react';

interface Plot {
    id: number;
    krs_matakuliah_id: number;
    krs_dosen_id: number | null;
    krs_ruang_id: number | null;
    krs_waktu_ids: number[] | null;
    hari: string | null;
    is_conflict: boolean;
    conflict_message: string | null;
    conflict_group_id?: number | null;
    matakuliah: { kode_mk: string; nama_mk: string; kelas: string; sks: number; jenis_ruang: string | null };
    dosen?: { id: number; nama_dosen: string };
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
    
    return (
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
                                                const timeStr = `${currentWaktuStart.jam_mulai.slice(0, 5)} - ${currentWaktuEnd.jam_selesai.slice(0, 5)}`;
                                                if (isKosong) {
                                                    rows.push(
                                                        <tr key={`kosong-${currentWaktuStart.id}`} className="border-border border-b border-dashed bg-emerald-50/30 dark:bg-emerald-950/10">
                                                            <td className="p-3 font-medium align-top">{rows.length === 0 ? hari : ''}</td>
                                                            <td className="p-3 align-top whitespace-nowrap text-muted-foreground">{timeStr}</td>
                                                            <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> KOSONG
                                                            </td>
                                                            <td className="p-3"></td>
                                                        </tr>
                                                    );
                                                } else {
                                                    const plot = dayPlots.find((p: Plot) => p.id === currentPlotId);
                                                    if (plot) {
                                                        const dosenName = plot.dosen ? plot.dosen.nama_dosen : 'Belum Ditentukan';
                                                        rows.push(
                                                            <tr key={`isi-${plot.id}-${currentWaktuStart.id}`} className="border-border border-b">
                                                                <td className="p-3 font-medium align-top">{rows.length === 0 ? hari : ''}</td>
                                                                <td className="p-3 align-top whitespace-nowrap text-muted-foreground">{timeStr}</td>
                                                                <td className="p-3">
                                                                    <div className="font-semibold text-slate-800 dark:text-slate-200">{plot.matakuliah.nama_mk} - {plot.matakuliah.kelas}</div>
                                                                    <div className="text-xs text-muted-foreground">{dosenName}</div>
                                                                </td>
                                                                <td className="p-3 align-top text-center">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditPlot(plot);
                                                                            setEditData({
                                                                                krs_dosen_id: plot.krs_dosen_id?.toString() || '',
                                                                                krs_ruang_id: plot.krs_ruang_id?.toString() || '',
                                                                                hari: plot.hari || 'Senin',
                                                                                krs_waktu_ids: plot.krs_waktu_ids || [],
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
    );
}
