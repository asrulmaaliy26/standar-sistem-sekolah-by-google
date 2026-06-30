import React from 'react';
import { Search, Edit, Lock } from 'lucide-react';

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

interface TabMapelProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    requestSort: (key: string) => void;
    sortedPlots: Plot[];
    setEditPlot: (plot: Plot) => void;
    setEditData: (data: any) => void;
    setEditTimes: (times: string[]) => void;
}

export default function TabMapel({
    searchQuery, setSearchQuery, filterStatus, setFilterStatus, sortConfig, requestSort, sortedPlots, setEditPlot, setEditData, setEditTimes
}: TabMapelProps) {
    return (
        <div className="bg-card text-card-foreground border-border overflow-x-auto rounded-xl border shadow-sm">
            {/* Search & Filter */}
            <div className="border-border bg-muted/20 flex flex-col gap-4 border-b p-4 md:flex-row">
                <div className="relative max-w-md flex-1">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Cari Kode MP, Nama MP, Pendidik, atau Ruang..."
                        className="border-input bg-background focus:ring-primary w-full rounded-md border py-2 pr-4 pl-9 text-sm focus:ring-2"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm font-medium whitespace-nowrap">Filter Status:</span>
                    <select
                        className="border-input bg-background focus:ring-primary rounded-md border px-3 py-2 text-sm focus:ring-2"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="Semua">Semua Status</option>
                        <option value="Aman">Aman (OK)</option>
                        <option value="Konflik">Konflik</option>
                        <option value="Belum Diplot">Belum Diplot</option>
                    </select>
                </div>
            </div>

            <table className="w-full border-collapse text-left">
                <thead className="bg-muted text-muted-foreground border-border border-b">
                    <tr>
                        <th className="hover:text-primary cursor-pointer p-3 select-none" onClick={() => requestSort('kode_mk')}>
                            Kode MP {sortConfig?.key === 'kode_mk' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="hover:text-primary cursor-pointer p-3 select-none" onClick={() => requestSort('nama_mk')}>
                            Nama MP {sortConfig?.key === 'nama_mk' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="hover:text-primary cursor-pointer p-3 select-none" onClick={() => requestSort('kelas')}>
                            Kelas {sortConfig?.key === 'kelas' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="hover:text-primary cursor-pointer p-3 select-none" onClick={() => requestSort('sks')}>
                            PJ {sortConfig?.key === 'sks' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="hover:text-primary cursor-pointer p-3 select-none" onClick={() => requestSort('jenis_ruang_mk')}>
                            Jenis Ruang MK {sortConfig?.key === 'jenis_ruang_mk' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="hover:text-primary cursor-pointer p-3 select-none" onClick={() => requestSort('dosen')}>
                            Pendidik {sortConfig?.key === 'dosen' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="hover:text-primary cursor-pointer p-3 select-none" onClick={() => requestSort('ruang')}>
                            Ruang (Kapasitas) {sortConfig?.key === 'ruang' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="hover:text-primary cursor-pointer p-3 select-none" onClick={() => requestSort('jadwal')}>
                            Jadwal {sortConfig?.key === 'jadwal' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="hover:text-primary cursor-pointer p-3 select-none" onClick={() => requestSort('status')}>
                            Status {sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-3">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedPlots.length === 0 ? (
                        <tr>
                            <td colSpan={10} className="text-muted-foreground p-4 text-center">
                                Belum ada data plot. Silakan import dan klik Plot Otomatis.
                            </td>
                        </tr>
                    ) : (
                        sortedPlots.map((p: Plot) => {
                            let rowBgClass = 'hover:bg-muted/50';
                            if (p.is_conflict && p.conflict_group_id) {
                                const colors = [
                                    'bg-yellow-100/70 dark:bg-yellow-900/30 hover:bg-yellow-200/70 dark:hover:bg-yellow-900/50',
                                    'bg-orange-100/70 dark:bg-orange-900/30 hover:bg-orange-200/70 dark:hover:bg-orange-900/50',
                                    'bg-blue-100/70 dark:bg-blue-900/30 hover:bg-blue-200/70 dark:hover:bg-blue-900/50',
                                    'bg-pink-100/70 dark:bg-pink-900/30 hover:bg-pink-200/70 dark:hover:bg-pink-900/50',
                                    'bg-cyan-100/70 dark:bg-cyan-900/30 hover:bg-cyan-200/70 dark:hover:bg-cyan-900/50',
                                    'bg-purple-100/70 dark:bg-purple-900/30 hover:bg-purple-200/70 dark:hover:bg-purple-900/50',
                                    'bg-emerald-100/70 dark:bg-emerald-900/30 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/50',
                                ];
                                rowBgClass = colors[(p.conflict_group_id - 1) % colors.length];
                            }

                            return (
                                <tr key={p.id} className={`border-border border-b transition-colors ${rowBgClass}`}>
                                    <td className="p-3 text-sm font-medium">{p.matakuliah.kode_mk}</td>
                                    <td className="p-3 text-sm">
                                        <div className="flex items-center gap-1">
                                            {p.matakuliah.nama_mk}
                                            {p.is_locked && <Lock className="h-3 w-3 text-amber-500" title="Diplot Manual (Terkunci)" />}
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm">{p.matakuliah.kelas}</td>
                                    <td className="p-3 text-sm">{p.matakuliah.sks}</td>
                                    <td className="p-3 text-sm">{p.matakuliah.jenis_ruang ?? '-'}</td>
                                    <td className="p-3 text-sm">
                                        {p.dosen?.nama_dosen ?? '-'}
                                        {p.dosen_kedua ? ` & ${p.dosen_kedua.nama_dosen}` : ''}
                                    </td>
                                    <td className="p-3 text-sm">
                                        {p.ruang ? `${p.ruang.nama_ruang} (${p.ruang.kapasitas ?? '-'})` : '-'}
                                    </td>
                                    <td className="p-3 text-sm">
                                        {p.waktu_details && p.waktu_details.length > 0 ? (
                                            <span>
                                                {p.hari ?? '-'}, {p.waktu_details[0].jam_mulai} -{' '}
                                                {p.waktu_details[p.waktu_details.length - 1].jam_selesai}
                                            </span>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="p-3">
                                        {p.is_conflict ? (
                                            <span className="inline-block rounded-full border border-red-200 bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                                                Konflik: {p.conflict_message}
                                            </span>
                                        ) : !p.krs_dosen_id && !p.krs_ruang_id ? (
                                            <span className="inline-block rounded-full border border-amber-200 bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                Belum Diplot
                                            </span>
                                        ) : (
                                            <span className="inline-block rounded-full border border-green-200 bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                                                OK
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <button
                                            onClick={() => {
                                                setEditPlot(p);
                                                setEditData({
                                                    krs_dosen_id: p.krs_dosen_id?.toString() || '',
                                                    krs_dosen_kedua_id: p.krs_dosen_kedua_id?.toString() || '',
                                                    krs_ruang_id: p.krs_ruang_id?.toString() || '',
                                                    hari: p.hari || 'Senin',
                                                    krs_waktu_ids: p.krs_waktu_ids || [],
                                                    is_locked: p.is_locked || false,
                                                });
                                                if (p.waktu_details && p.waktu_details.length > 0) {
                                                    setEditTimes(
                                                        p.waktu_details.map((w: any) => `${w.jam_mulai} - ${w.jam_selesai}`),
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
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
