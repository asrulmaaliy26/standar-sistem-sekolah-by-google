import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Download, Upload, Play, RefreshCw, Trash2, Edit, Plus, Search, Check, AlertCircle, BookOpen, Users, MapPin, Clock, ArrowRight, Calculator } from 'lucide-react';

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
    matakuliah: { kode_mk: string, nama_mk: string, kelas: string, sks: number };
    dosen?: { id: number, nama_dosen: string };
    ruang?: { id: number, nama_ruang: string };
    waktu_details?: { id: number, hari: string, jam_mulai: string, jam_selesai: string }[];
}

export default function KrsIndex({ periods, activePeriodId, plots, matakuliahs, dosens, ruangs, waktus }: any) {
    const { data: periodData, setData: setPeriodData, post: postPeriod } = useForm({
        tahun_akademik: '',
        semester: 'Ganjil'
    });

    const { data: importData, setData: setImportData, post: postImport } = useForm({
        type: 'matakuliah',
        file: null as File | null,
        period_id: activePeriodId
    });

    const [editPlot, setEditPlot] = useState<Plot | null>(null);
    const { data: editData, setData: setEditData, put: putEdit } = useForm({
        krs_dosen_id: '',
        krs_ruang_id: '',
        hari: 'Senin',
        krs_waktu_ids: [] as number[]
    });

    const [editTimes, setEditTimes] = useState<string[]>([]);
    
    const [viewMasterData, setViewMasterData] = useState<string | null>(null);

    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');

    const [genJamMulai, setGenJamMulai] = useState("07:00");
    const [genDurasi, setGenDurasi] = useState(40);
    const [genSlot, setGenSlot] = useState(10);
    const [genIsIstirahat, setGenIsIstirahat] = useState(false);
    const [genIstirahatMulai, setGenIstirahatMulai] = useState("09:40");
    const [genIstirahatSelesai, setGenIstirahatSelesai] = useState("10:10");

    let finalTimeStr = "";
    if (genJamMulai && genDurasi > 0 && genSlot > 0) {
        let [h, m] = genJamMulai.split(':').map(Number);
        let totalMinutes = h * 60 + m;
        
        let istMulaiMins = 0;
        let istSelesaiMins = 0;
        if (genIsIstirahat && genIstirahatMulai && genIstirahatSelesai) {
            let [ih, im] = genIstirahatMulai.split(':').map(Number);
            istMulaiMins = ih * 60 + im;
            let [sh, sm] = genIstirahatSelesai.split(':').map(Number);
            istSelesaiMins = sh * 60 + sm;
        }

        for(let i = 0; i < genSlot; i++) {
            if (genIsIstirahat && istMulaiMins && istSelesaiMins) {
                if (totalMinutes >= istMulaiMins && totalMinutes < istSelesaiMins) {
                    totalMinutes = istSelesaiMins;
                }
            }
            totalMinutes += genDurasi;
        }
        
        const finalH = Math.floor(totalMinutes / 60) % 24;
        const finalM = totalMinutes % 60;
        finalTimeStr = `${finalH.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')}`;
    }

    const sortedPlots = React.useMemo(() => {
        let sortableItems = [...(plots || [])];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            sortableItems = sortableItems.filter((p: Plot) => 
                p.matakuliah.kode_mk.toLowerCase().includes(q) ||
                p.matakuliah.nama_mk.toLowerCase().includes(q) ||
                (p.dosen?.nama_dosen || '').toLowerCase().includes(q) ||
                (p.ruang?.nama_ruang || '').toLowerCase().includes(q)
            );
        }

        if (filterStatus === 'Konflik') {
            sortableItems = sortableItems.filter((p: Plot) => p.is_conflict);
        } else if (filterStatus === 'Aman') {
            sortableItems = sortableItems.filter((p: Plot) => !p.is_conflict && p.krs_dosen_id && p.krs_ruang_id);
        } else if (filterStatus === 'Belum Diplot') {
            sortableItems = sortableItems.filter((p: Plot) => !p.is_conflict && !p.krs_dosen_id && !p.krs_ruang_id);
        }

        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any, bValue: any;
                switch (sortConfig.key) {
                    case 'kode_mk':
                        aValue = a.matakuliah.kode_mk;
                        bValue = b.matakuliah.kode_mk;
                        break;
                    case 'nama_mk':
                        aValue = a.matakuliah.nama_mk;
                        bValue = b.matakuliah.nama_mk;
                        break;
                    case 'kelas':
                        aValue = a.matakuliah.kelas;
                        bValue = b.matakuliah.kelas;
                        break;
                    case 'sks':
                        aValue = a.matakuliah.sks;
                        bValue = b.matakuliah.sks;
                        break;
                    case 'dosen':
                        aValue = a.dosen?.nama_dosen || '';
                        bValue = b.dosen?.nama_dosen || '';
                        break;
                    case 'ruang':
                        aValue = a.ruang?.nama_ruang || '';
                        bValue = b.ruang?.nama_ruang || '';
                        break;
                    case 'jadwal':
                        aValue = a.hari || '';
                        bValue = b.hari || '';
                        break;
                    case 'status':
                        aValue = a.is_conflict ? 1 : (a.krs_waktu_ids ? 0 : -1);
                        bValue = b.is_conflict ? 1 : (b.krs_waktu_ids ? 0 : -1);
                        break;
                    default:
                        return 0;
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [plots, sortConfig, searchQuery, filterStatus]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const uniqueWaktuStrings = Array.from(new Set(waktus?.map((w: any) => `${w.jam_mulai} - ${w.jam_selesai}`) || [])) as string[];

    const handleCreatePeriod = (e: React.FormEvent) => {
        e.preventDefault();
        postPeriod(route('admin.krs.period.store'), {
            onSuccess: () => alert('Periode berhasil dibuat!')
        });
    };

    const isMatakuliahUploaded = matakuliahs && matakuliahs.length > 0;

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importData.file) return alert('Pilih file CSV');
        postImport(route('admin.krs.import'), {
            onSuccess: () => {
                setImportData('file', null);
            }
        });
    };

    const handlePlot = () => {
        if(confirm('Lakukan ploting otomatis?')) {
            router.post(route('admin.krs.plot'), { period_id: activePeriodId });
        }
    };

    const handleResetPlot = () => {
        if(confirm('Reset hanya hasil plot (hapus dosen, ruang, waktu)?')) {
            router.post(route('admin.krs.reset'), { period_id: activePeriodId });
        }
    };

    const handleResetAll = () => {
        if(confirm('Hapus seluruh hasil plotting dari database?')) {
            router.post(route('admin.krs.reset_all'), { period_id: activePeriodId });
        }
    };

    const handleExport = () => {
        window.location.href = route('admin.krs.export', { period_id: activePeriodId });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if(editPlot) {
            putEdit(route('admin.krs.plot.update', editPlot.id), {
                onSuccess: () => {
                    alert('Plot diperbarui');
                    setEditPlot(null);
                }
            });
        }
    };

    const handleDeleteMasterData = (type: string, id: number) => {
        if (confirm(`Yakin ingin menghapus data ${type} ini?`)) {
            router.delete(route('admin.krs.master_data.delete_single', { type, id }), {
                preserveScroll: true
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Ploting Jadwal', href: '/admin/krs' }]}>
            <Head title="Ploting Jadwal" />

            <div className="p-6 w-full mx-auto space-y-6">
                
                {/* Header & Period Selection */}
                <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Sistem Ploting Jadwal</h1>
                        <p className="text-sm text-muted-foreground">Pilih atau buat periode akademik baru.</p>
                    </div>
                    
                    <div className="flex gap-4">
                        <select 
                            className="border border-input bg-background text-foreground dark:bg-slate-900 dark:text-slate-100 p-2 rounded"
                            value={activePeriodId}
                            onChange={(e) => router.get(route('admin.krs.index', { period_id: e.target.value }))}
                        >
                            <option value="">-- Pilih Periode --</option>
                            {periods.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.tahun_akademik} - {p.semester}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Create Period Form */}
                <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border">
                    <h2 className="font-semibold mb-4">Buat Periode Baru</h2>
                    <form onSubmit={handleCreatePeriod} className="flex gap-4 items-end">
                        <div>
                            <label className="block text-xs mb-1">Tahun Akademik (ex: 2026/2027)</label>
                            <input required type="text" className="border border-input bg-background text-foreground dark:bg-slate-900 dark:text-slate-100 p-2 rounded" value={periodData.tahun_akademik} onChange={e => setPeriodData('tahun_akademik', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs mb-1">Semester</label>
                            <select className="border border-input bg-background text-foreground dark:bg-slate-900 dark:text-slate-100 p-2 rounded" value={periodData.semester} onChange={e => setPeriodData('semester', e.target.value as any)}>
                                <option>Ganjil</option>
                                <option>Genap</option>
                            </select>
                        </div>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium">Buat Periode</button>
                    </form>
                </div>

                {activePeriodId && (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {[
                                { title: 'Mapel', count: matakuliahs.length, id: 'matakuliah', icon: BookOpen, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
                                { title: 'Pendidik', count: dosens.length, id: 'dosen', icon: Users, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' },
                                { title: 'Ruang', count: ruangs.length, id: 'ruang', icon: MapPin, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
                                { title: 'Waktu', count: waktus.length, id: 'waktu', icon: Clock, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
                            ].map(s => (
                                <div key={s.id} className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-semibold text-muted-foreground">{s.title}</h3>
                                        <div className={`p-2 rounded-lg ${s.color}`}>
                                            <s.icon className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <span className="text-3xl font-bold">{s.count}</span>
                                    </div>
                                    <button onClick={() => setViewMasterData(s.id)} className="text-sm font-medium text-primary hover:text-primary/80 flex items-center group w-fit">
                                        {s.id === 'waktu' ? 'Kelola Waktu' : 'Lihat Data'} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Import Section */}
                        <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-semibold flex items-center gap-2"><Upload className="w-5 h-5"/> Import Data Master</h2>
                                <a href={route('admin.krs.template', importData.type)} className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-md text-sm font-semibold border border-blue-200 dark:border-blue-800 transition-colors shadow-sm">
                                    <Download className="w-4 h-4" /> Unduh Template
                                </a>
                            </div>
                            <form onSubmit={handleImport} className="flex gap-4 items-end">
                                <div>
                                    <label className="block text-xs mb-1">Jenis Data</label>
                                    <select className="border border-input bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50 p-2 rounded" value={importData.type} onChange={e => setImportData('type', e.target.value)}>
                                        <option value="matakuliah">1. Mapel & Kelas</option>
                                        <option value="dosen" disabled={!isMatakuliahUploaded}>2. Pendidik & Distribusi Mapel</option>
                                        <option value="ruang" disabled={!isMatakuliahUploaded}>3. List Ruang</option>
                                    </select>
                                    {!isMatakuliahUploaded && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Upload Mapel dulu.</p>}
                                </div>
                                <div>
                                    <label className="block text-xs mb-1">File (CSV / XLSX)</label>
                                    <input type="file" accept=".csv,.txt,.xlsx,.xls" onChange={e => setImportData('file', e.target.files?.[0] || null)} className="border border-input bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50 p-1.5 rounded w-64 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                                </div>
                                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded">Upload & Import</button>
                            </form>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button onClick={handlePlot} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center gap-2 shadow">
                                <Play className="w-4 h-4"/> Plot Otomatis
                            </button>
                            <button onClick={handleResetPlot} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded flex items-center gap-2 shadow">
                                <RefreshCw className="w-4 h-4"/> Reset Plot
                            </button>
                            <button onClick={handleResetAll} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 shadow">
                                <Trash2 className="w-4 h-4"/> Reset Semua
                            </button>
                            <button onClick={handleExport} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded flex items-center gap-2 ml-auto shadow">
                                <Download className="w-4 h-4"/> Export CSV
                            </button>
                        </div>

                        {/* Table */}
                        <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border overflow-x-auto">
                            
                            {/* Search & Filter */}
                            <div className="flex flex-col md:flex-row gap-4 p-4 border-b border-border bg-muted/20">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input 
                                        type="text" 
                                        placeholder="Cari Kode MP, Nama MP, Pendidik, atau Ruang..." 
                                        className="w-full pl-9 pr-4 py-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary text-sm"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter Status:</span>
                                    <select 
                                        className="border border-input rounded-md px-3 py-2 bg-background focus:ring-2 focus:ring-primary text-sm"
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

                            <table className="w-full text-left border-collapse">
                                <thead className="bg-muted text-muted-foreground border-b border-border">
                                    <tr>
                                        <th className="p-3 cursor-pointer hover:text-primary select-none" onClick={() => requestSort('kode_mk')}>Kode MP {sortConfig?.key === 'kode_mk' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th className="p-3 cursor-pointer hover:text-primary select-none" onClick={() => requestSort('nama_mk')}>Nama MP {sortConfig?.key === 'nama_mk' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th className="p-3 cursor-pointer hover:text-primary select-none" onClick={() => requestSort('kelas')}>Kelas {sortConfig?.key === 'kelas' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th className="p-3 cursor-pointer hover:text-primary select-none" onClick={() => requestSort('sks')}>PJ {sortConfig?.key === 'sks' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th className="p-3 cursor-pointer hover:text-primary select-none" onClick={() => requestSort('dosen')}>Pendidik {sortConfig?.key === 'dosen' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th className="p-3 cursor-pointer hover:text-primary select-none" onClick={() => requestSort('ruang')}>Ruang {sortConfig?.key === 'ruang' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th className="p-3 cursor-pointer hover:text-primary select-none" onClick={() => requestSort('jadwal')}>Jadwal {sortConfig?.key === 'jadwal' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th className="p-3 cursor-pointer hover:text-primary select-none" onClick={() => requestSort('status')}>Status {sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th className="p-3">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedPlots.length === 0 ? (
                                        <tr><td colSpan={9} className="p-4 text-center text-muted-foreground">Belum ada data plot. Silakan import dan klik Plot Otomatis.</td></tr>
                                    ) : sortedPlots.map((p: Plot) => {
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
                                        <tr key={p.id} className={`border-b border-border transition-colors ${rowBgClass}`}>
                                            <td className="p-3 text-sm font-medium">{p.matakuliah.kode_mk}</td>
                                            <td className="p-3 text-sm">{p.matakuliah.nama_mk}</td>
                                            <td className="p-3 text-sm">{p.matakuliah.kelas}</td>
                                            <td className="p-3 text-sm">{p.matakuliah.sks}</td>
                                            <td className="p-3 text-sm">{p.dosen?.nama_dosen ?? '-'}</td>
                                            <td className="p-3 text-sm">{p.ruang?.nama_ruang ?? '-'}</td>
                                            <td className="p-3 text-sm">
                                                {p.waktu_details && p.waktu_details.length > 0 ? (
                                                    <span>{p.hari ?? '-'}, {p.waktu_details[0].jam_mulai} - {p.waktu_details[p.waktu_details.length-1].jam_selesai}</span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-3">
                                                {p.is_conflict ? (
                                                    <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-semibold border border-red-200 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
                                                        Konflik: {p.conflict_message}
                                                    </span>
                                                ) : (!p.krs_dosen_id && !p.krs_ruang_id) ? (
                                                    <span className="inline-block bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-semibold border border-amber-200 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300">
                                                        Belum Diplot
                                                    </span>
                                                ) : (
                                                    <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold border border-green-200 dark:bg-green-950 dark:border-green-800 dark:text-green-300">
                                                        OK
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <button onClick={() => {
                                                    setEditPlot(p);
                                                    setEditData({
                                                        krs_dosen_id: p.krs_dosen_id?.toString() || '',
                                                        krs_ruang_id: p.krs_ruang_id?.toString() || '',
                                                        hari: p.hari || 'Senin',
                                                        krs_waktu_ids: p.krs_waktu_ids || []
                                                    });
                                                    if (p.waktu_details && p.waktu_details.length > 0) {
                                                        setEditTimes(p.waktu_details.map((w: any) => `${w.jam_mulai} - ${w.jam_selesai}`));
                                                    } else {
                                                        setEditTimes([]);
                                                    }
                                                }} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Edit Modal */}
                {editPlot && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-card text-card-foreground border border-border rounded-xl p-6 w-full max-w-4xl shadow-2xl relative max-h-[90vh] flex flex-col">
                            <h3 className="font-bold text-xl mb-2">Edit Plot Manual</h3>
                            <p className="text-sm text-muted-foreground mb-6">Mapel: <span className="font-bold text-foreground">{editPlot.matakuliah.kode_mk} - {editPlot.matakuliah.nama_mk} ({editPlot.matakuliah.sks} PJ)</span></p>
                            
                            <form onSubmit={submitEdit} className="flex-1 overflow-y-auto pr-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Column: Form Inputs */}
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Pendidik</label>
                                            <select className="w-full border border-input bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50 p-2.5 rounded-md shadow-sm focus:ring-2 focus:ring-primary" value={editData.krs_dosen_id} onChange={e => setEditData('krs_dosen_id', e.target.value)}>
                                                <option value="">-- Pilih Pendidik --</option>
                                                {dosens.filter((d: any) => d.kode_mk === editPlot.matakuliah.kode_mk).map((d: any) => <option key={d.id} value={d.id}>{d.nama_dosen}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Ruang</label>
                                            <select className="w-full border border-input bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50 p-2.5 rounded-md shadow-sm focus:ring-2 focus:ring-primary" value={editData.krs_ruang_id} onChange={e => setEditData('krs_ruang_id', e.target.value)}>
                                                <option value="">-- Pilih Ruang --</option>
                                                {ruangs.map((r: any) => <option key={r.id} value={r.id}>{r.nama_ruang}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Hari</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(hariStr => {
                                                    // Count how many slots are taken overall on this day?
                                                    // For now, just render nice buttons
                                                    const isSelected = editData.hari === hariStr;
                                                    return (
                                                        <button 
                                                            key={hariStr} 
                                                            type="button"
                                                            onClick={() => setEditData('hari', hariStr)}
                                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input hover:bg-muted text-foreground'}`}
                                                        >
                                                            {hariStr}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Time Grid */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="block text-sm font-medium">Pilih Waktu (Butuh {editPlot.matakuliah.sks} Slot)</label>
                                            <span className="text-xs text-muted-foreground">Klik slot untuk memilih</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1">
                                            {uniqueWaktuStrings.map((timeStr: string) => {
                                                const [mulai, selesai] = timeStr.split(' - ');
                                                const matchedWaktu = waktus.find((w: any) => w.jam_mulai === mulai && w.jam_selesai === selesai);
                                                
                                                let takenDosen = false;
                                                let takenRuang = false;
                                                
                                                if (matchedWaktu && editData.hari) {
                                                    for (const p of plots) {
                                                        if (p.id === editPlot.id) continue;
                                                        if (p.hari !== editData.hari) continue;
                                                        if (!p.krs_waktu_ids || !p.krs_waktu_ids.includes(matchedWaktu.id)) continue;
                                                
                                                        if (editData.krs_dosen_id && p.krs_dosen_id == editData.krs_dosen_id) takenDosen = true;
                                                        if (editData.krs_ruang_id && p.krs_ruang_id == editData.krs_ruang_id) takenRuang = true;
                                                    }
                                                }

                                                const isSelected = editTimes.includes(timeStr);
                                                
                                                let btnClass = "border border-input bg-background hover:border-primary/50 text-foreground";
                                                let icon = null;

                                                if (isSelected) {
                                                    if (takenDosen || takenRuang) {
                                                        btnClass = "border-red-500 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-2 ring-red-500 ring-offset-1";
                                                    } else {
                                                        btnClass = "border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1";
                                                    }
                                                } else if (takenDosen && takenRuang) {
                                                    btnClass = "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900 text-red-600 dark:text-red-400 opacity-60";
                                                } else if (takenDosen) {
                                                    btnClass = "border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-900 text-orange-600 dark:text-orange-400 opacity-70";
                                                } else if (takenRuang) {
                                                    btnClass = "border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-900 text-amber-600 dark:text-amber-400 opacity-70";
                                                }

                                                return (
                                                    <button 
                                                        key={timeStr}
                                                        type="button"
                                                        onClick={() => {
                                                            let newTimes = [...editTimes];
                                                            const isSelected = newTimes.includes(timeStr);

                                                            if (!isSelected) {
                                                                // Jika ngeklik slot kosong, langsung blok otomatis sebanyak jumlah SKS
                                                                if (editPlot?.matakuliah?.sks) {
                                                                    const sks = editPlot.matakuliah.sks;
                                                                    const clickedIndex = uniqueWaktuStrings.indexOf(timeStr);
                                                                    if (clickedIndex !== -1) {
                                                                        newTimes = uniqueWaktuStrings.slice(clickedIndex, clickedIndex + sks);
                                                                    }
                                                                } else {
                                                                    newTimes.push(timeStr);
                                                                }
                                                            } else {
                                                                // Jika slot sudah terpilih, hapus (unselect manual)
                                                                newTimes = newTimes.filter(t => t !== timeStr);
                                                            }

                                                            setEditTimes(newTimes);
                                                            const resolvedIds = newTimes.map(ts => {
                                                                const [m, s] = ts.split(' - ');
                                                                const matched = waktus.find((w: any) => w.jam_mulai === m && w.jam_selesai === s);
                                                                return matched ? matched.id : null;
                                                            }).filter(id => id !== null);
                                                            setEditData('krs_waktu_ids', resolvedIds as number[]);
                                                        }}
                                                        className={`p-2 text-xs rounded-md text-left transition-all ${btnClass}`}
                                                    >
                                                        <div className="font-semibold">{timeStr}</div>
                                                        <div className="text-[10px] mt-1 leading-tight">
                                                            {takenDosen && takenRuang ? 'Pendidik & Ruang Terpakai' : takenDosen ? 'Pendidik Mengajar' : takenRuang ? 'Ruang Terpakai' : 'Tersedia'}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground bg-muted/50 p-2 rounded border border-border">
                                            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-background border border-input block"></span> Tersedia</div>
                                            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary block"></span> Dipilih (OK)</div>
                                            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-100 border border-orange-200 block"></span> Pendidik Terpakai</div>
                                            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-200 block"></span> Ruang Terpakai</div>
                                            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 block"></span> Dipilih (Bentrok!)</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end mt-8 border-t border-border pt-4">
                                    <button type="button" onClick={() => setEditPlot(null)} className="px-4 py-2 border border-input hover:bg-muted text-foreground rounded transition-colors font-medium">Batal</button>
                                    <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium shadow-sm">Simpan Jadwal</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Master Data View Modal */}
                {viewMasterData && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-background text-foreground border border-border rounded-xl shadow-2xl w-[700px] max-w-[95vw] flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-border flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <h3 className="font-bold text-lg capitalize">Data Master: {viewMasterData}</h3>
                                    {activePeriodId && (
                                        <div className="flex items-center gap-2">
                                            {viewMasterData === 'dosen' && (
                                                <button 
                                                    onClick={() => {
                                                        if (confirm('Sistem akan menghitung total PJ dari setiap Mapel dan membaginya rata kepada semua pendidik pengampu yang batas PJ-nya belum diisi. Lanjutkan?')) {
                                                            router.post(route('admin.krs.master_data.dosen.auto_sks'), {
                                                                period_id: activePeriodId
                                                            }, {
                                                                preserveScroll: true,
                                                                onSuccess: () => alert('Pembagian PJ Otomatis selesai.')
                                                            });
                                                        }
                                                    }} 
                                                    className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 px-3 py-1.5 rounded-md border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 font-semibold transition-colors shadow-sm"
                                                >
                                                    <Calculator className="w-3 h-3"/> Bagi Rata PJ Otomatis
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => {
                                                    if (confirm(`Yakin ingin menghapus SEMUA data ${viewMasterData}? Ini tidak dapat dibatalkan.`)) {
                                                        router.post(route('admin.krs.master_data.delete'), {
                                                            period_id: activePeriodId,
                                                            type: viewMasterData
                                                        }, {
                                                            onSuccess: () => setViewMasterData(null)
                                                        });
                                                    }
                                                }} 
                                                className="text-xs bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 px-3 py-1.5 rounded-md border border-red-200 dark:border-red-800 flex items-center gap-1 font-semibold transition-colors shadow-sm"
                                            >
                                                <Trash2 className="w-3 h-3"/> Hapus Semua
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setViewMasterData(null)} className="text-muted-foreground hover:text-foreground text-2xl leading-none">&times;</button>
                            </div>
                            <div className="overflow-auto border-b border-border flex-1 bg-muted/10">
                                {viewMasterData === 'waktu' ? (
                                    <div className="p-6">
                                        <form onSubmit={e => {
                                            e.preventDefault();
                                            const formData = new FormData(e.currentTarget);
                                            router.post(route('admin.krs.period.hari_aktif'), {
                                                period_id: activePeriodId,
                                                hari_aktif: formData.getAll('hari_aktif[]')
                                            }, {
                                                preserveScroll: true,
                                                onSuccess: () => alert('Hari Aktif berhasil disimpan!')
                                            });
                                        }} className="bg-card border border-border p-5 rounded-lg shadow-sm mb-6">
                                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                                <h4 className="font-bold">Pengaturan Hari Aktif</h4>
                                                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded font-medium shadow-sm">Simpan Hari Aktif</button>
                                            </div>
                                            <div className="flex gap-4 flex-wrap">
                                                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(h => {
                                                    const currentPeriod = periods.find((p: any) => p.id === parseInt(activePeriodId));
                                                    const isChecked = currentPeriod?.hari_aktif ? currentPeriod.hari_aktif.includes(h) : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].includes(h);
                                                    return (
                                                        <label key={h} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                                            <input type="checkbox" name="hari_aktif[]" value={h} defaultChecked={isChecked} className="rounded border-input text-primary focus:ring-primary" /> {h}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </form>

                                        <form onSubmit={e => {
                                            e.preventDefault();
                                            const formData = new FormData(e.currentTarget);
                                            const payload = {
                                                period_id: activePeriodId,
                                                jam_mulai: formData.get('jam_mulai'),
                                                durasi_sks: formData.get('durasi_sks'),
                                                jumlah_slot: formData.get('jumlah_slot'),
                                                is_istirahat: formData.get('is_istirahat') === 'on',
                                                istirahat_mulai: formData.get('istirahat_mulai'),
                                                istirahat_selesai: formData.get('istirahat_selesai'),
                                            };
                                            router.post(route('admin.krs.waktu.generate'), payload, {
                                                onSuccess: () => alert('Berhasil di-generate!')
                                            });
                                        }} className="bg-card border border-border p-5 rounded-lg shadow-sm">
                                            <h4 className="font-bold mb-4 border-b pb-2">Form Generator Otomatis Waktu</h4>
                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Jam Mulai Pertama</label>
                                                    <input type="time" name="jam_mulai" required value={genJamMulai} onChange={e => setGenJamMulai(e.target.value)} className="w-full border border-input bg-background p-2 rounded" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Durasi 1 PJ (Menit)</label>
                                                    <input type="number" name="durasi_sks" required value={genDurasi} onChange={e => setGenDurasi(parseInt(e.target.value))} min={1} className="w-full border border-input bg-background p-2 rounded" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Total Slot (Per Hari)</label>
                                                    <input type="number" name="jumlah_slot" required value={genSlot} onChange={e => setGenSlot(parseInt(e.target.value))} min={1} max={30} className="w-full border border-input bg-background p-2 rounded" />
                                                </div>
                                            </div>

                                            <div className="mb-4 p-4 border border-border rounded-lg bg-background">
                                                <label className="flex items-center gap-2 mb-3 font-medium cursor-pointer">
                                                    <input type="checkbox" name="is_istirahat" id="is_istirahat_chk" className="rounded text-primary" checked={genIsIstirahat} onChange={e => setGenIsIstirahat(e.target.checked)} /> 
                                                    Ada Jam Istirahat?
                                                </label>
                                                {genIsIstirahat && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium mb-1">Mulai Istirahat</label>
                                                            <input type="time" name="istirahat_mulai" value={genIstirahatMulai} onChange={e => setGenIstirahatMulai(e.target.value)} className="w-full border border-input bg-background p-2 rounded" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium mb-1">Selesai Istirahat</label>
                                                            <input type="time" name="istirahat_selesai" value={genIstirahatSelesai} onChange={e => setGenIstirahatSelesai(e.target.value)} className="w-full border border-input bg-background p-2 rounded" />
                                                        </div>
                                                    </div>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-2 italic">* Jika waktu jam pelajaran bersinggungan dengan jam istirahat, sistem akan otomatis melompati jam istirahat tersebut.</p>
                                            </div>

                                            {finalTimeStr && (
                                                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-sm font-medium flex items-center justify-between">
                                                    <span>Estimasi Jam Berakhir:</span>
                                                    <span className="text-lg font-bold">{finalTimeStr}</span>
                                                </div>
                                            )}

                                            <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded shadow-sm w-full">
                                                Generate Waktu Sekarang
                                            </button>
                                        </form>

                                        <h4 className="font-bold mt-8 mb-4">Daftar Waktu Tersimpan ({waktus.length})</h4>
                                        <table className="w-full text-left border-collapse text-sm bg-background border border-border rounded-lg overflow-hidden">
                                            <thead className="bg-muted text-muted-foreground border-b border-border">
                                                <tr><th className="p-3">Jam Mulai</th><th className="p-3">Jam Selesai</th><th className="p-3">Aksi</th></tr>
                                            </thead>
                                            <tbody>
                                                {waktus.map((w: any) => (
                                                    <tr key={w.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                                                        <td className="p-3">{w.jam_mulai}</td>
                                                        <td className="p-3">{w.jam_selesai}</td>
                                                        <td className="p-3">
                                                            <button onClick={() => handleDeleteMasterData('waktu', w.id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded"><Trash2 className="w-4 h-4"/></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {waktus.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">Belum ada waktu di-generate.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead className="bg-muted text-muted-foreground border-b border-border sticky top-0">
                                            {viewMasterData === 'matakuliah' && <tr><th className="p-3">Kode MP</th><th className="p-3">Nama Mapel</th><th className="p-3">Kelas</th><th className="p-3">PJ</th><th className="p-3">Aksi</th></tr>}
                                            {viewMasterData === 'dosen' && <tr><th className="p-3">Pendidik Pengampu</th><th className="p-3">Kode MP</th><th className="p-3">Nama Mapel</th><th className="p-3">Max PJ</th><th className="p-3">Aksi</th></tr>}
                                            {viewMasterData === 'ruang' && <tr><th className="p-3">Nama Ruang</th><th className="p-3">Kapasitas</th><th className="p-3">Aksi</th></tr>}
                                        </thead>
                                        <tbody>
                                            {viewMasterData === 'matakuliah' && matakuliahs.map((m: any) => (
                                                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                                                    <td className="p-3 font-medium">{m.kode_mk}</td><td className="p-3">{m.nama_mk}</td><td className="p-3">{m.kelas}</td><td className="p-3">{m.sks}</td>
                                                    <td className="p-3"><button onClick={() => handleDeleteMasterData('matakuliah', m.id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded"><Trash2 className="w-4 h-4"/></button></td>
                                                </tr>
                                            ))}
                                            {viewMasterData === 'matakuliah' && (
                                                <tr className="border-b border-border bg-muted/30">
                                                    <td className="p-3"><input type="text" id="new_mk_kode" className="w-full border border-input rounded p-1 text-sm bg-background" placeholder="Kode MP" /></td>
                                                    <td className="p-3"><input type="text" id="new_mk_nama" className="w-full border border-input rounded p-1 text-sm bg-background" placeholder="Nama Mapel" /></td>
                                                    <td className="p-3"><input type="text" id="new_mk_kelas" className="w-full border border-input rounded p-1 text-sm bg-background" placeholder="Kelas" /></td>
                                                    <td className="p-3"><input type="number" id="new_mk_sks" className="w-full border border-input rounded p-1 text-sm bg-background" placeholder="PJ" min="1" /></td>
                                                    <td className="p-3">
                                                        <button onClick={() => {
                                                            const kode = (document.getElementById('new_mk_kode') as HTMLInputElement).value;
                                                            const nama = (document.getElementById('new_mk_nama') as HTMLInputElement).value;
                                                            const kelas = (document.getElementById('new_mk_kelas') as HTMLInputElement).value;
                                                            const sks = (document.getElementById('new_mk_sks') as HTMLInputElement).value;
                                                            if(!kode || !nama || !kelas || !sks) return alert('Lengkapi data');
                                                            router.post(route('admin.krs.master_data.store'), {
                                                                period_id: activePeriodId, type: 'matakuliah', kode_mp: kode, nama_mp: nama, kelas: kelas, pj: sks
                                                            }, {
                                                                preserveScroll: true,
                                                                onSuccess: () => {
                                                                    (document.getElementById('new_mk_kode') as HTMLInputElement).value = '';
                                                                    (document.getElementById('new_mk_nama') as HTMLInputElement).value = '';
                                                                    (document.getElementById('new_mk_kelas') as HTMLInputElement).value = '';
                                                                    (document.getElementById('new_mk_sks') as HTMLInputElement).value = '';
                                                                }
                                                            });
                                                        }} className="text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2 py-1.5 rounded font-medium text-xs">Tambah</button>
                                                    </td>
                                                </tr>
                                            )}
                                            {viewMasterData === 'dosen' && dosens.map((d: any) => {
                                                const mk = matakuliahs.find((m: any) => m.kode_mk === d.kode_mk);
                                                return (
                                                    <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                                                        <td className="p-3 font-medium">{d.nama_dosen}</td>
                                                        <td className="p-3">{d.kode_mk}</td>
                                                        <td className="p-3">{mk ? mk.nama_mk : '-'}</td>
                                                        <td className="p-3">
                                                            <input 
                                                                type="number" 
                                                                className="w-20 border border-input rounded p-1 text-sm bg-background" 
                                                                defaultValue={d.max_sks || ''} 
                                                                placeholder="Unlimit"
                                                                onBlur={(e) => {
                                                                    const val = e.target.value;
                                                                    if (val !== String(d.max_sks || '')) {
                                                                        router.put(route('admin.krs.master_data.dosen.update_sks', d.id), { max_sks: val }, {
                                                                            preserveScroll: true,
                                                                            onSuccess: () => alert('Batas PJ ' + d.nama_dosen + ' berhasil diperbarui.')
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="p-3"><button onClick={() => handleDeleteMasterData('dosen', d.id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded"><Trash2 className="w-4 h-4"/></button></td>
                                                    </tr>
                                                );
                                            })}
                                            {viewMasterData === 'dosen' && (
                                                <tr className="border-b border-border bg-muted/30">
                                                    <td className="p-3"><input type="text" id="new_dsn_nama" className="w-full border border-input rounded p-1 text-sm bg-background" placeholder="Nama Pendidik" /></td>
                                                    <td className="p-3"><input type="text" id="new_dsn_kode" className="w-full border border-input rounded p-1 text-sm bg-background" placeholder="Kode MP" /></td>
                                                    <td className="p-3">-</td>
                                                    <td className="p-3"><input type="number" id="new_dsn_sks" className="w-full border border-input rounded p-1 text-sm bg-background" placeholder="Max PJ" /></td>
                                                    <td className="p-3">
                                                        <button onClick={() => {
                                                            const nama = (document.getElementById('new_dsn_nama') as HTMLInputElement).value;
                                                            const kode = (document.getElementById('new_dsn_kode') as HTMLInputElement).value;
                                                            const sks = (document.getElementById('new_dsn_sks') as HTMLInputElement).value;
                                                            if(!nama || !kode) return alert('Lengkapi data');
                                                            router.post(route('admin.krs.master_data.store'), {
                                                                period_id: activePeriodId, type: 'dosen', nama_pendidik: nama, kode_mp: kode, max_pj: sks || null
                                                            }, {
                                                                preserveScroll: true,
                                                                onSuccess: () => {
                                                                    (document.getElementById('new_dsn_nama') as HTMLInputElement).value = '';
                                                                    (document.getElementById('new_dsn_kode') as HTMLInputElement).value = '';
                                                                    (document.getElementById('new_dsn_sks') as HTMLInputElement).value = '';
                                                                }
                                                            });
                                                        }} className="text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2 py-1.5 rounded font-medium text-xs">Tambah</button>
                                                    </td>
                                                </tr>
                                            )}
                                            {viewMasterData === 'ruang' && ruangs.map((r: any) => (
                                                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                                                    <td className="p-3 font-medium">{r.nama_ruang}</td><td className="p-3">{r.kapasitas}</td>
                                                    <td className="p-3"><button onClick={() => handleDeleteMasterData('ruang', r.id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded"><Trash2 className="w-4 h-4"/></button></td>
                                                </tr>
                                            ))}
                                            {viewMasterData === 'ruang' && (
                                                <tr className="border-b border-border bg-muted/30">
                                                    <td className="p-3"><input type="text" id="new_rng_nama" className="w-full border border-input rounded p-1 text-sm bg-background" placeholder="Nama Ruang" /></td>
                                                    <td className="p-3"><input type="number" id="new_rng_kapasitas" className="w-full border border-input rounded p-1 text-sm bg-background" placeholder="Kapasitas" min="1" /></td>
                                                    <td className="p-3">
                                                        <button onClick={() => {
                                                            const nama = (document.getElementById('new_rng_nama') as HTMLInputElement).value;
                                                            const kap = (document.getElementById('new_rng_kapasitas') as HTMLInputElement).value;
                                                            if(!nama || !kap) return alert('Lengkapi data');
                                                            router.post(route('admin.krs.master_data.store'), {
                                                                period_id: activePeriodId, type: 'ruang', nama_ruang: nama, kapasitas: kap
                                                            }, {
                                                                preserveScroll: true,
                                                                onSuccess: () => {
                                                                    (document.getElementById('new_rng_nama') as HTMLInputElement).value = '';
                                                                    (document.getElementById('new_rng_kapasitas') as HTMLInputElement).value = '';
                                                                }
                                                            });
                                                        }} className="text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2 py-1.5 rounded font-medium text-xs">Tambah</button>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            <div className="flex justify-end mt-4 p-6 pt-0 border-t border-border pt-4">
                                <button onClick={() => setViewMasterData(null)} className="px-4 py-2 border border-input hover:bg-muted text-foreground rounded transition-colors">Tutup</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
