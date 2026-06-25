import React from 'react';
import { Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';

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

interface TabPendidikProps {
    dosens: any[];
    plots: Plot[];
    rule3Active: boolean;
    setEditPlot: (plot: any) => void;
    setEditData: (data: any) => void;
    setEditTimes: (times: string[]) => void;
}

export default function TabPendidik({
    dosens, plots, rule3Active, setEditPlot, setEditData, setEditTimes
}: TabPendidikProps) {
    const groups = new Map();

    // Prepare groups by nama_dosen
    dosens?.forEach((d: any) => {
        const name = d.nama_dosen.trim();
        if (!groups.has(name)) {
            groups.set(name, {
                nama_dosen: name,
                plots: [],
                unplotted: [],
                totalSks: 0,
                maxSks: 0,
                hasUnbounded: false,
                dosenMap: new Map(),
            });
        }
        const g = groups.get(name);
        g.dosenMap.set(d.kode_mk, d.id);
        if (d.max_sks === null || d.max_sks === undefined) {
            g.hasUnbounded = true;
        } else {
            g.maxSks += Number(d.max_sks);
        }
    });
    
    groups.set('belum', {
        nama_dosen: 'Belum Ditentukan / Kosong',
        plots: [],
        unplotted: [],
        totalSks: 0,
        maxSks: 0,
        hasUnbounded: true,
        dosenMap: new Map(),
    });

    // Fill plots
    plots?.forEach((p: Plot) => {
        let name = 'Belum Ditentukan / Kosong';

        if (p.krs_dosen_id && p.dosen) {
            name = p.dosen.nama_dosen.trim();
        } else if (p.krs_dosen_id) {
            const d = dosens?.find((d: any) => d.id === p.krs_dosen_id);
            if (d) name = d.nama_dosen.trim();
            else name = 'Tidak Diketahui';
        }

        if (p.krs_dosen_id) {
            if (!groups.has(name)) {
                groups.set(name, {
                    nama_dosen: name,
                    plots: [],
                    unplotted: [],
                    totalSks: 0,
                    maxSks: 0,
                    hasUnbounded: true,
                    dosenMap: new Map(),
                });
            }
            const g = groups.get(name);
            g.plots.push(p);
            g.totalSks += p.matakuliah.sks;
        } else {
            // Plot is fully unassigned to any dosen
            // Assign it to the "belum" group's plots
            groups.get('belum').plots.push(p);

            // Also find all dosens that COULD teach this
            const eligibleDosens = dosens?.filter((d: any) => d.kode_mk === p.matakuliah.kode_mk) || [];
            eligibleDosens.forEach((d: any) => {
                const dName = d.nama_dosen.trim();
                if (groups.has(dName)) {
                    groups.get(dName).unplotted.push({ ...p, suggested_dosen_id: d.id });
                }
            });
        }
    });

    const renderGroups = Array.from(groups.values())
        .filter((g) => g.plots.length > 0 || g.maxSks > 0)
        .map((g, idx) => {
            const limitText = g.hasUnbounded ? '∞' : g.maxSks;
            const isOverLimit = !g.hasUnbounded && g.totalSks > g.maxSks;

            return (
                <div key={idx} className="bg-card border-border overflow-hidden rounded-xl border shadow-sm">
                    <div className="bg-muted/30 border-border flex flex-col items-start justify-between gap-2 border-b px-4 py-3 md:flex-row md:items-center">
                        <h3 className="text-lg font-bold">{g.nama_dosen}</h3>
                        <div className="flex items-center gap-3">
                            <span className="text-sm">
                                Batas Total: <strong>{limitText} SKS</strong>
                            </span>
                            <span
                                className={`rounded-full px-2.5 py-1 text-sm font-medium ${isOverLimit ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}
                            >
                                Terplot: {g.totalSks} SKS
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead className="bg-muted/50 text-muted-foreground border-border border-b">
                                <tr>
                                    <th className="p-3">Kode MP</th>
                                    <th className="p-3">Nama MP</th>
                                    <th className="p-3">Kelas</th>
                                    <th className="p-3">SKS</th>
                                    <th className="p-3">Jenis Ruang (MK)</th>
                                    <th className="p-3">Jadwal & Ruang (Kapasitas)</th>
                                    <th className="p-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {g.plots.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-muted-foreground p-4 text-center">
                                            Belum ada kelas yang diplot untuk pendidik ini.
                                        </td>
                                    </tr>
                                ) : (
                                    (() => {
                                        const dailyLoad: Record<string, number> = {};
                                        g.plots.forEach((p: Plot) => {
                                            if (p.hari) {
                                                dailyLoad[p.hari] = (dailyLoad[p.hari] || 0) + (p.matakuliah.sks || 0);
                                            }
                                        });
                                        return g.plots.map((p: Plot) => {
                                            const isOverload = p.hari && (rule3Active ?? true) && dailyLoad[p.hari] > 6;
                                            return (
                                                <tr
                                                    key={p.id}
                                                    className={`border-border border-b last:border-0 ${isOverload ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20' : 'hover:bg-muted/30'}`}
                                                >
                                                    <td className="p-3 font-medium">{p.matakuliah.kode_mk}</td>
                                                    <td className="p-3">{p.matakuliah.nama_mk}</td>
                                                    <td className="p-3">{p.matakuliah.kelas}</td>
                                                    <td className="p-3">{p.matakuliah.sks}</td>
                                                    <td className="p-3">{p.matakuliah.jenis_ruang ?? '-'}</td>
                                                    <td className="p-3">
                                                        {p.hari && p.waktu_details && p.waktu_details.length > 0 ? (
                                                            <span className={`${isOverload ? 'bg-amber-100 text-amber-700 dark:bg-amber-800/50 dark:text-amber-400' : 'bg-primary/10 text-primary'} inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold`}>
                                                                {p.hari}, {p.waktu_details[0].jam_mulai} -{' '}
                                                                {p.waktu_details[p.waktu_details.length - 1].jam_selesai}
                                                                <span className={`${isOverload ? 'text-amber-600/80 dark:text-amber-400/80' : 'text-muted-foreground'} ml-1 font-normal`}>
                                                                    (
                                                                    {p.ruang
                                                                        ? `${p.ruang.nama_ruang} [${p.ruang.kapasitas ?? '-'}]`
                                                                        : '-'}
                                                                    )
                                                                </span>
                                                                {isOverload && <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white rounded-md text-[9px] uppercase tracking-wider font-bold shadow-sm">⚠️ Overload &gt; 6 SKS</span>}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs italic">
                                                                Belum diplot
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        <button
                                                            onClick={() => {
                                                                if (
                                                                    confirm(
                                                                        `Yakin ingin mereset plot kelas ${p.matakuliah.nama_mk} (${p.matakuliah.kelas})? Pendidik, ruangan, dan waktu akan dikosongkan.`,
                                                                    )
                                                                ) {
                                                                    // @ts-ignore
                                                                    router.put(
                                                                        // @ts-ignore
                                                                        route('admin.krs.plot.update', p.id),
                                                                        {
                                                                            krs_dosen_id: null,
                                                                            krs_ruang_id: null,
                                                                            hari: null,
                                                                            krs_waktu_ids: [],
                                                                        },
                                                                        { preserveScroll: true },
                                                                    );
                                                                }
                                                            }}
                                                            className="rounded bg-red-50 p-1.5 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                                                            title="Kosongkan (Reset) Kelas Ini"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })()
                                )}
                                {g.unplotted && g.unplotted.length > 0 && (
                                    <>
                                        <tr className="bg-muted/10">
                                            <td
                                                colSpan={7}
                                                className="text-muted-foreground border-border border-b p-3 font-semibold"
                                            >
                                                Mapel Yang Belum Diplot (Bisa Diambil)
                                            </td>
                                        </tr>
                                        {g.unplotted.map((p: any) => (
                                            <tr
                                                key={`un-${p.id}`}
                                                className="border-border hover:bg-muted/30 border-b opacity-70 last:border-0"
                                            >
                                                <td className="p-3 font-medium">{p.matakuliah.kode_mk}</td>
                                                <td className="p-3">{p.matakuliah.nama_mk}</td>
                                                <td className="p-3">{p.matakuliah.kelas}</td>
                                                <td className="p-3">{p.matakuliah.sks}</td>
                                                <td className="p-3">{p.matakuliah.jenis_ruang ?? '-'}</td>
                                                <td className="p-3 text-xs font-medium text-red-500">
                                                    Belum Ada Dosen & Jadwal
                                                </td>
                                                <td className="p-3">
                                                    <button
                                                        onClick={() => {
                                                            setEditPlot(p);
                                                            setEditData({
                                                                krs_dosen_id: p.suggested_dosen_id || '',
                                                                krs_ruang_id: p.krs_ruang_id || '',
                                                                hari: p.hari || '',
                                                                krs_waktu_ids: p.krs_waktu_ids || [],
                                                            });
                                                            setEditTimes([]);
                                                        }}
                                                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-2 py-1 text-xs font-semibold"
                                                    >
                                                        Plot Manual
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        });

    return (
        <div className="space-y-6">
            {renderGroups}
        </div>
    );
}
