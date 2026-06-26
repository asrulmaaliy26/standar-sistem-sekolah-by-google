import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    BookOpen,
    Calculator,
    Check,
    Clock,
    Download,
    Edit,
    MapPin,
    Play,
    RefreshCw,
    Search,
    Trash2,
    Upload,
    Users,
    Info,
    AlertTriangle, 
    CalendarDays, 
    CheckCircle2, 
    ChevronRight, 
    FileDown, 
    FileUp, 
    ListTodo, 
    Plus, 
    Settings, 
    Save,
} from 'lucide-react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import TabMapel from './Tabs/TabMapel';
import TabPendidik from './Tabs/TabPendidik';
import TabRuangan from './Tabs/TabRuangan';

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
    matakuliah: { kode_mk: string; nama_mk: string; kelas: string; sks: number };
    dosen?: { id: number; nama_dosen: string };
    ruang?: { id: number; nama_ruang: string };
    waktu_details?: { id: number; hari: string; jam_mulai: string; jam_selesai: string }[];
}

export default function KrsIndex({ periods, activePeriodId, plots, matakuliahs, dosens, ruangs, waktus, readiness_data }: any) {
    const {
        data: periodData,
        setData: setPeriodData,
        post: postPeriod,
    } = useForm({
        tahun_akademik: '',
        semester: 'Ganjil',
    });

    const {
        data: importData,
        setData: setImportData,
        post: postImport,
    } = useForm({
        type: 'matakuliah',
        file: null as File | null,
        period_id: activePeriodId,
    });

    const [editPlot, setEditPlot] = useState<Plot | null>(null);
    const {
        data: editData,
        setData: setEditData,
        put: putEdit,
    } = useForm({
        krs_dosen_id: '',
        krs_ruang_id: '',
        hari: 'Senin',
        krs_waktu_ids: [] as number[],
    });

    const [editTimes, setEditTimes] = useState<string[]>([]);

    const [viewMasterData, setViewMasterData] = useState<string | null>(null);

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [activeTab, setActiveTab] = useState<'mapel' | 'dosen' | 'ruang'>('mapel');

    // State for Aturan Batasan Waktu Khusus (saved in localStorage)
    const [ruleActive, setRuleActive] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('krs_rule_active') || 'false');
        } catch {
            return false;
        }
    });
    const [ruleStartSlot, setRuleStartSlot] = useState(() => {
        return parseInt(localStorage.getItem('krs_rule_start') || '3');
    });
    const [ruleEndSlot, setRuleEndSlot] = useState(() => {
        return parseInt(localStorage.getItem('krs_rule_end') || '8');
    });
    const [ruleMkCodes, setRuleMkCodes] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('krs_rule_mks') || '[]');
        } catch {
            return [];
        }
    });

    const [rule2Active, setRule2Active] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('krs_rule2_active') || 'false');
        } catch {
            return false;
        }
    });
    const [rule2StartSlot, setRule2StartSlot] = useState(() => {
        return parseInt(localStorage.getItem('krs_rule2_start') || '1');
    });
    const [rule2EndSlot, setRule2EndSlot] = useState(() => {
        return parseInt(localStorage.getItem('krs_rule2_end') || '10');
    });
    const [rule2MkCodes, setRule2MkCodes] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('krs_rule2_mks') || '[]');
        } catch {
            return [];
        }
    });

    const [rule3Active, setRule3Active] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('krs_rule3_active') || 'true');
        } catch {
            return true;
        }
    });

    const [activeRuleTab, setActiveRuleTab] = useState<'aturan1' | 'aturan2' | 'aturan3'>('aturan1');

    // Streaming states
    const [isPlotting, setIsPlotting] = useState(false);
    const [plotLogs, setPlotLogs] = useState<{iteration: number, message: string, score?: number}[]>([]);

    React.useEffect(() => {
        localStorage.setItem('krs_rule_active', JSON.stringify(ruleActive));
        localStorage.setItem('krs_rule_start', ruleStartSlot.toString());
        localStorage.setItem('krs_rule_end', ruleEndSlot.toString());
        localStorage.setItem('krs_rule_mks', JSON.stringify(ruleMkCodes));

        localStorage.setItem('krs_rule2_active', JSON.stringify(rule2Active));
        localStorage.setItem('krs_rule2_start', rule2StartSlot.toString());
        localStorage.setItem('krs_rule2_end', rule2EndSlot.toString());
        localStorage.setItem('krs_rule2_mks', JSON.stringify(rule2MkCodes));
        localStorage.setItem('krs_rule3_active', JSON.stringify(rule3Active));
    }, [ruleActive, ruleStartSlot, ruleEndSlot, ruleMkCodes, rule2Active, rule2StartSlot, rule2EndSlot, rule2MkCodes, rule3Active]);

    const [genJamMulai, setGenJamMulai] = useState('07:00');
    const [genDurasi, setGenDurasi] = useState(40);
    const [genSlot, setGenSlot] = useState(10);
    const [genIsIstirahat, setGenIsIstirahat] = useState(false);
    const [genIstirahatMulai, setGenIstirahatMulai] = useState('09:40');
    const [genIstirahatSelesai, setGenIstirahatSelesai] = useState('10:10');

    let finalTimeStr = '';
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

        for (let i = 0; i < genSlot; i++) {
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
            sortableItems = sortableItems.filter(
                (p: Plot) =>
                    p.matakuliah.kode_mk.toLowerCase().includes(q) ||
                    p.matakuliah.nama_mk.toLowerCase().includes(q) ||
                    (p.dosen?.nama_dosen || '').toLowerCase().includes(q) ||
                    (p.ruang?.nama_ruang || '').toLowerCase().includes(q),
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
                        aValue = a.is_conflict ? 1 : a.krs_waktu_ids ? 0 : -1;
                        bValue = b.is_conflict ? 1 : b.krs_waktu_ids ? 0 : -1;
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
            onSuccess: () => alert('Periode berhasil dibuat!'),
        });
    };

    const isMatakuliahUploaded = matakuliahs && matakuliahs.length > 0;

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importData.file) return alert('Pilih file CSV');
        postImport(route('admin.krs.import'), {
            onSuccess: () => {
                setImportData('file', null);
            },
        });
    };

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
        return '';
    };

    const handlePlot = async () => {
        if (!confirm('Lakukan ploting otomatis (Iteratif Ruin & Recreate)? Proses ini mungkin memakan waktu beberapa detik.')) {
            return;
        }

        setIsPlotting(true);
        setPlotLogs([]);

        try {
            const response = await fetch(route('admin.krs.plot-stream'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
                },
                body: JSON.stringify({
                    period_id: activePeriodId,
                    batasan_waktu: {
                        aktif: ruleActive,
                        start_slot: ruleStartSlot,
                        end_slot: ruleEndSlot,
                        kode_mps: ruleMkCodes,
                    },
                    batasan_waktu_2: {
                        aktif: rule2Active,
                        start_slot: rule2StartSlot,
                        end_slot: rule2EndSlot,
                        kode_mps: rule2MkCodes,
                    },
                    batasan_waktu_3: {
                        aktif: rule3Active,
                    },
                })
            });

            if (!response.body) throw new Error('No readable stream');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                
                const parts = buffer.split('\n\n');
                buffer = parts.pop() || '';

                for (const part of parts) {
                    if (part.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(part.substring(6));
                            setPlotLogs(prev => [...prev, data]);
                            if (data.done) {
                                setTimeout(() => {
                                    setIsPlotting(false);
                                    router.reload();
                                }, 1500);
                            }
                        } catch (e) {
                            console.error('SSE parse error:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Streaming error', error);
            setIsPlotting(false);
            alert('Terjadi kesalahan saat memproses streaming plotting.');
        }
    };

    const handleResetPlot = () => {
        if (confirm('Reset hanya hasil plot (hapus dosen, ruang, waktu)?')) {
            router.post(route('admin.krs.reset'), { period_id: activePeriodId });
        }
    };

    const handleResetAll = () => {
        if (confirm('Hapus seluruh hasil plotting dari database?')) {
            router.post(route('admin.krs.reset_all'), { period_id: activePeriodId });
        }
    };

    const handleExport = () => {
        window.location.href = route('admin.krs.export', { period_id: activePeriodId });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editPlot) {
            putEdit(route('admin.krs.plot.update', editPlot.id), {
                onSuccess: () => {
                    alert('Plot diperbarui');
                    setEditPlot(null);
                },
            });
        }
    };

    const handleDeleteMasterData = (type: string, id: number) => {
        if (confirm(`Yakin ingin menghapus data ${type} ini?`)) {
            router.delete(route('admin.krs.master_data.delete_single', { type, id }), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Ploting Jadwal', href: '/admin/krs' }]}>
            <Head title="Ploting Jadwal" />

            <div className="mx-auto w-full space-y-6 p-6">
                {/* Header & Period Selection */}
                <div className="bg-card text-card-foreground border-border flex items-center justify-between rounded-xl border p-6 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold">Sistem Ploting Jadwal</h1>
                        <p className="text-muted-foreground text-sm">Pilih atau buat periode akademik baru.</p>
                    </div>

                    <div className="flex gap-4">
                        <select
                            className="border-input bg-background text-foreground rounded border p-2 dark:bg-slate-900 dark:text-slate-100"
                            value={activePeriodId}
                            onChange={(e) => router.get(route('admin.krs.index', { period_id: e.target.value }))}
                        >
                            <option value="">-- Pilih Periode --</option>
                            {periods.map((p: any) => (
                                <option key={p.id} value={p.id}>
                                    {p.tahun_akademik} - {p.semester}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Create Period Form */}
                <div className="bg-card text-card-foreground border-border rounded-xl border p-6 shadow-sm">
                    <h2 className="mb-4 font-semibold">Buat Periode Baru</h2>
                    <form onSubmit={handleCreatePeriod} className="flex items-end gap-4">
                        <div>
                            <label className="mb-1 block text-xs">Tahun Akademik (ex: 2026/2027)</label>
                            <input
                                required
                                type="text"
                                className="border-input bg-background text-foreground rounded border p-2 dark:bg-slate-900 dark:text-slate-100"
                                value={periodData.tahun_akademik}
                                onChange={(e) => setPeriodData('tahun_akademik', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs">Semester</label>
                            <select
                                className="border-input bg-background text-foreground rounded border p-2 dark:bg-slate-900 dark:text-slate-100"
                                value={periodData.semester}
                                onChange={(e) => setPeriodData('semester', e.target.value as any)}
                            >
                                <option>Ganjil</option>
                                <option>Genap</option>
                            </select>
                        </div>
                        <button type="submit" className="rounded bg-blue-600 px-4 py-2 font-medium text-white">
                            Buat Periode
                        </button>
                    </form>
                </div>

                {activePeriodId && (
                    <>
                        {/* Stats Grid */}
                        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {[
                                {
                                    title: 'Mapel',
                                    count: matakuliahs.length,
                                    id: 'matakuliah',
                                    icon: BookOpen,
                                    color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
                                },
                                {
                                    title: 'Pendidik',
                                    count: dosens.length,
                                    id: 'dosen',
                                    icon: Users,
                                    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
                                },
                                {
                                    title: 'Ruang',
                                    count: ruangs.length,
                                    id: 'ruang',
                                    icon: MapPin,
                                    color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
                                },
                                {
                                    title: 'Waktu',
                                    count: waktus.length,
                                    id: 'waktu',
                                    icon: Clock,
                                    color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
                                },
                            ].map((s) => (
                                <div
                                    key={s.id}
                                    className="bg-card text-card-foreground border-border flex flex-col justify-between rounded-xl border p-5 shadow-sm"
                                >
                                    <div className="mb-4 flex items-start justify-between">
                                        <h3 className="text-muted-foreground font-semibold">{s.title}</h3>
                                        <div className={`rounded-lg p-2 ${s.color}`}>
                                            <s.icon className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <span className="text-3xl font-bold">{s.count}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setViewMasterData(s.id);
                                        }}
                                        className="text-primary hover:text-primary/80 group flex w-fit items-center text-sm font-medium"
                                    >
                                        {s.id === 'waktu' ? 'Kelola Waktu' : 'Lihat Data'}{' '}
                                        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Import Section */}
                        <div className="bg-card text-card-foreground border-border rounded-xl border p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="flex items-center gap-2 font-semibold">
                                    <Upload className="h-5 w-5" /> Import Data Master
                                </h2>
                                <a
                                    href={route('admin.krs.template', importData.type)}
                                    className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                                >
                                    <Download className="h-4 w-4" /> Unduh Template
                                </a>
                            </div>
                            <form onSubmit={handleImport} className="flex items-end gap-4">
                                <div>
                                    <label className="mb-1 block text-xs">Jenis Data</label>
                                    <select
                                        className="border-input rounded border bg-white p-2 text-slate-900 dark:bg-slate-950 dark:text-slate-50"
                                        value={importData.type}
                                        onChange={(e) => setImportData('type', e.target.value)}
                                    >
                                        <option value="matakuliah">1. Mapel & Kelas</option>
                                        <option value="dosen" disabled={!isMatakuliahUploaded}>
                                            2. Pendidik & Distribusi Mapel
                                        </option>
                                        <option value="ruang" disabled={!isMatakuliahUploaded}>
                                            3. List Ruang
                                        </option>
                                    </select>
                                    {!isMatakuliahUploaded && <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Upload Mapel dulu.</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs">File (CSV / XLSX)</label>
                                    <input
                                        type="file"
                                        accept=".csv,.txt,.xlsx,.xls"
                                        onChange={(e) => setImportData('file', e.target.files?.[0] || null)}
                                        className="border-input file:bg-primary/10 file:text-primary hover:file:bg-primary/20 w-64 rounded border bg-white p-1.5 text-slate-900 file:mr-2 file:rounded-md file:border-0 file:px-2 file:py-1 file:text-sm file:font-semibold dark:bg-slate-950 dark:text-slate-50"
                                    />
                                </div>
                                <button type="submit" className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">
                                    Upload & Import
                                </button>
                            </form>
                        </div>

                        {/* Readiness Analysis */}
                        {readiness_data && (
                            <div className="bg-card text-card-foreground border-border mb-6 rounded-xl border p-6 shadow-sm">
                                <h2 className="mb-4 flex items-center gap-2 font-semibold">
                                    <Calculator className="h-5 w-5" /> Analisis Kesiapan Data
                                </h2>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div
                                        className={`rounded-lg border p-4 ${readiness_data.status_guru === 'KURANG' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'}`}
                                    >
                                        <h3 className="mb-2 flex items-center gap-2 font-medium">
                                            {readiness_data.status_guru === 'KURANG' ? (
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                            ) : (
                                                <Check className="h-4 w-4 text-emerald-500" />
                                            )}
                                            Kesiapan Pendidik
                                        </h3>
                                        <p className="mb-1 text-sm">
                                            Total Kebutuhan: <span className="font-bold">{readiness_data.total_sks_mapel} SKS</span>
                                        </p>
                                        <p className="mb-2 text-sm">
                                            Total Kapasitas Pendidik:{' '}
                                            <span className="font-bold">
                                                {readiness_data.total_kapasitas_guru == 0
                                                    ? 'Unlimited / Tak Terbatas'
                                                    : readiness_data.total_kapasitas_guru + ' Max SKS'}
                                            </span>{' '}
                                            ({readiness_data.total_guru} Pendidik)
                                        </p>
                                        {readiness_data.status_guru === 'KURANG' && (
                                            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                                                <strong>Peringatan:</strong> Kekurangan Kapasitas Pendidik! Plotting otomatis akan gagal menemukan
                                                pendidik untuk beberapa mapel. Gunakan fitur 'Bagi Rata PJ Otomatis' di menu Kelola Pendidik terlebih
                                                dahulu.
                                            </p>
                                        )}
                                        {readiness_data.status_guru === 'OK' && (
                                            <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                                                Kapasitas SKS pendidik secara total mencukupi.
                                            </p>
                                        )}
                                        {(() => {
                                            if (!matakuliahs || !dosens) return null;
                                            const dosenMks = new Set(dosens.map((d: any) => d.kode_mk));
                                            const mapelsWithoutDosen = matakuliahs.filter((m: any) => !dosenMks.has(m.kode_mk));
                                            if (mapelsWithoutDosen.length > 0) {
                                                const uniqueMissing = Array.from(
                                                    new Map(mapelsWithoutDosen.map((m: any) => [m.kode_mk, m])).values(),
                                                );
                                                return (
                                                    <div className="mt-3 rounded border border-orange-200 bg-orange-50 p-2 dark:border-orange-800 dark:bg-orange-900/20">
                                                        <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-orange-700 dark:text-orange-400">
                                                            <AlertCircle className="h-3 w-3" /> Ada {uniqueMissing.length} Mapel belum ada Pendidik!
                                                        </p>
                                                        <ul className="max-h-24 list-disc space-y-0.5 overflow-y-auto pl-4 text-[10px] text-orange-600 dark:text-orange-300">
                                                            {uniqueMissing.map((m: any) => (
                                                                <li key={m.kode_mk}>
                                                                    {m.kode_mk} - {m.nama_mk}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                    <div
                                        className={`rounded-lg border p-4 ${readiness_data.status_ruang === 'KURANG' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'}`}
                                    >
                                        <h3 className="mb-2 flex items-center gap-2 font-medium">
                                            {readiness_data.status_ruang === 'KURANG' ? (
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                            ) : (
                                                <Check className="h-4 w-4 text-blue-500" />
                                            )}
                                            Kesiapan Ruangan Fisik
                                        </h3>
                                        <p className="mb-1 text-sm">
                                            Total Kebutuhan: <span className="font-bold">{readiness_data.total_sks_mapel} Slot</span>
                                        </p>
                                        <p className="mb-3 text-sm">
                                            Total Kapasitas Fisik: <span className="font-bold">{readiness_data.total_kapasitas_ruang} Slot</span>
                                            <br />
                                            <span className="text-muted-foreground text-xs">
                                                ({readiness_data.total_ruang_fisik} Ruang Fisik × {readiness_data.hari_aktif_count} Hari Aktif ×{' '}
                                                {readiness_data.slot_per_hari} JP/Hari)
                                            </span>
                                        </p>

                                        {readiness_data.status_ruang_detail && readiness_data.status_ruang_detail.length > 0 && (
                                            <div className="mt-2 space-y-2 border-t border-blue-200 pt-2 dark:border-blue-800">
                                                <p className="mb-1 text-xs font-semibold text-blue-800 dark:text-blue-300">
                                                    Rincian per Jenis Ruang:
                                                </p>
                                                {readiness_data.status_ruang_detail.map((detail: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between text-xs">
                                                        <span>{detail.jenis}</span>
                                                        <span
                                                            className={`rounded px-2 font-medium ${detail.status === 'OK' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                                                        >
                                                            {detail.kebutuhan} butuh / {detail.kapasitas} tersedia
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {readiness_data.status_ruang === 'KURANG' && (
                                            <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                                                <strong>Peringatan:</strong> Ruangan fisik (total atau tipe tertentu) tidak mencukupi untuk menampung
                                                seluruh SKS. Plotting otomatis akan kesulitan atau menyisakan banyak kelas tak terplot.
                                            </p>
                                        )}
                                        {readiness_data.status_ruang === 'OK' && (
                                            <p className="mt-3 text-xs text-blue-600 dark:text-blue-400">
                                                Ruangan fisik dan spesifikasinya sangat mencukupi.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Container */}
                        <div className="mb-6">
                            <div className="border-border mb-4 flex border-b">
                                <button
                                    onClick={() => setActiveRuleTab('aturan1')}
                                    className={`px-4 py-2 text-sm font-semibold transition-colors ${activeRuleTab === 'aturan1' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Aturan Waktu Khusus 1
                                </button>
                                <button
                                    onClick={() => setActiveRuleTab('aturan2')}
                                    className={`px-4 py-2 text-sm font-semibold transition-colors ${activeRuleTab === 'aturan2' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Aturan Waktu Khusus 2
                                </button>
                                <button
                                    onClick={() => setActiveRuleTab('aturan3')}
                                    className={`px-4 py-2 text-sm font-semibold transition-colors ${activeRuleTab === 'aturan3' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Aturan Beban Dosen
                                </button>
                            </div>

                            {/* Content Aturan 1 */}
                            {activeRuleTab === 'aturan1' && (
                                <div className="bg-card text-card-foreground border-border rounded-xl border p-5 shadow-sm">
                                    <label className="mb-2 flex cursor-pointer items-center gap-2 font-semibold">
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500"
                                            checked={ruleActive}
                                            onChange={(e) => setRuleActive(e.target.checked)}
                                        />
                                        Aktifkan Aturan Waktu Khusus (Batasan Slot Jam)
                                    </label>

                                    {ruleActive && (
                                        <div className="mt-3 space-y-4 pl-7 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <label className="mb-1 block text-xs font-medium">Mulai dari Jam ke-</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={30}
                                                        value={ruleStartSlot}
                                                        onChange={(e) => setRuleStartSlot(parseInt(e.target.value) || 1)}
                                                        className="border-input bg-background w-32 rounded border p-1.5 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-xs font-medium">Maksimal Hingga Jam ke-</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={30}
                                                        value={ruleEndSlot}
                                                        onChange={(e) => setRuleEndSlot(parseInt(e.target.value) || 1)}
                                                        className="border-input bg-background w-32 rounded border p-1.5 text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium">Pilih Kode Mapel yang Terkena Aturan Ini:</label>
                                                <div className="border-border bg-background/50 grid max-h-48 grid-cols-1 gap-2 overflow-y-auto rounded border p-2 md:grid-cols-2 lg:grid-cols-3">
                                                    {matakuliahs &&
                                                        Array.from(new Map(matakuliahs.map((m: any) => [m.kode_mk, m])).values()).map((m: any) => (
                                                            <label
                                                                key={m.kode_mk}
                                                                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded p-1 text-xs"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    className="text-primary focus:ring-primary rounded"
                                                                    checked={ruleMkCodes.includes(m.kode_mk)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setRuleMkCodes((prev) => [...prev, m.kode_mk]);
                                                                        } else {
                                                                            setRuleMkCodes((prev) => prev.filter((c) => c !== m.kode_mk));
                                                                        }
                                                                    }}
                                                                />
                                                                <span className="font-medium">{m.kode_mk}</span> -{' '}
                                                                <span className="truncate" title={m.nama_mk}>
                                                                    {m.nama_mk}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    {(!matakuliahs || matakuliahs.length === 0) && (
                                                        <span className="text-muted-foreground p-2 text-xs">Belum ada data matakuliah.</span>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Content Aturan 2 */}
                            {activeRuleTab === 'aturan2' && (
                                <div className="bg-card text-card-foreground border-border rounded-xl border p-5 shadow-sm">
                                    <label className="mb-2 flex cursor-pointer items-center gap-2 font-semibold">
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500"
                                            checked={rule2Active}
                                            onChange={(e) => setRule2Active(e.target.checked)}
                                        />
                                        Aktifkan Aturan Waktu Khusus 2 (Batasan Slot Jam)
                                    </label>

                                    {rule2Active && (
                                        <div className="mt-3 space-y-4 pl-7 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <label className="mb-1 block text-xs font-medium">Mulai dari Jam ke-</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={30}
                                                        value={rule2StartSlot}
                                                        onChange={(e) => setRule2StartSlot(parseInt(e.target.value) || 1)}
                                                        className="border-input bg-background w-32 rounded border p-1.5 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-xs font-medium">Maksimal Hingga Jam ke-</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={30}
                                                        value={rule2EndSlot}
                                                        onChange={(e) => setRule2EndSlot(parseInt(e.target.value) || 1)}
                                                        className="border-input bg-background w-32 rounded border p-1.5 text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium">Pilih Kode Mapel yang Terkena Aturan Ini:</label>
                                                <div className="border-border bg-background/50 grid max-h-48 grid-cols-1 gap-2 overflow-y-auto rounded border p-2 md:grid-cols-2 lg:grid-cols-3">
                                                    {matakuliahs &&
                                                        Array.from(new Map(matakuliahs.map((m: any) => [m.kode_mk, m])).values()).map((m: any) => (
                                                            <label
                                                                key={m.kode_mk}
                                                                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded p-1 text-xs"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    className="text-primary focus:ring-primary rounded"
                                                                    checked={rule2MkCodes.includes(m.kode_mk)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setRule2MkCodes((prev) => [...prev, m.kode_mk]);
                                                                        } else {
                                                                            setRule2MkCodes((prev) => prev.filter((c) => c !== m.kode_mk));
                                                                        }
                                                                    }}
                                                                />
                                                                <span className="font-medium">{m.kode_mk}</span> -{' '}
                                                                <span className="truncate" title={m.nama_mk}>
                                                                    {m.nama_mk}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    {(!matakuliahs || matakuliahs.length === 0) && (
                                                        <span className="text-muted-foreground p-2 text-xs">Belum ada data matakuliah.</span>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Content Aturan 3 */}
                            {activeRuleTab === 'aturan3' && (
                                <div className="bg-card text-card-foreground border-border rounded-xl border p-5 shadow-sm">
                                    <label className="mb-2 flex cursor-pointer items-center gap-2 font-semibold">
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500"
                                            checked={rule3Active}
                                            onChange={(e) => setRule3Active(e.target.checked)}
                                        />
                                        Aktifkan Aturan Beban Dosen (Maksimal 6 SKS/Hari)
                                    </label>

                                    {rule3Active && (
                                        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
                                            <h4 className="mb-2 flex items-center gap-2 font-bold">
                                                <Info className="h-5 w-5" /> Info Aturan Beban Dosen
                                            </h4>
                                            <p className="text-sm">
                                                Dengan mengaktifkan aturan ini, sistem akan mencegah seorang dosen mengajar lebih dari{' '}
                                                <strong>6 SKS (6 JP) dalam 1 hari yang sama</strong>. Sisa jadwal mengajar dosen tersebut akan secara
                                                otomatis dipindahkan ke hari lain yang masih kosong.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Kesimpulan Kalkulasi */}
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-100">
                            <h3 className="mb-3 flex items-center gap-2 font-bold text-lg">
                                <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /> Kesimpulan Prediksi Sistem
                            </h3>
                            {(() => {
                                // Kapasitas Fisik
                                const activeRuangs = ruangs?.filter((r: any) => {
                                    const n = (r.nama_ruang || '').toLowerCase();
                                    return !n.includes('daring') && !n.includes('online');
                                }) || [];
                                const countBesar = activeRuangs.filter((r:any) => (r.kapasitas || '').toLowerCase() === 'besar').length;
                                const countKecil = activeRuangs.filter((r:any) => (r.kapasitas || '').toLowerCase() === 'kecil').length;
                                const totalHari = readiness_data?.hari_aktif_count || 5;
                                const totalSlotPerHari = waktus?.length || 10;
                                
                                const capBesarOverall = countBesar * totalHari * totalSlotPerHari;
                                const capKecilOverall = countKecil * totalHari * totalSlotPerHari;

                                let butuhBesarTotal = 0, butuhKecilTotal = 0;
                                matakuliahs?.forEach((m:any) => {
                                    if ((m.jenis_ruang || '').toLowerCase() === 'kecil') butuhKecilTotal += m.sks;
                                    else butuhBesarTotal += m.sks;
                                });

                                // Aturan 1
                                const rMks1 = matakuliahs?.filter((m: any) => ruleMkCodes.includes(m.kode_mk)) || [];
                                let r1ButuhBesar = 0, r1ButuhKecil = 0;
                                const r1TeacherLoads: Record<number, number> = {};
                                rMks1.forEach((m:any) => {
                                    if ((m.jenis_ruang || '').toLowerCase() === 'kecil') r1ButuhKecil += m.sks;
                                    else r1ButuhBesar += m.sks;
                                    if (m.dosen_id) {
                                        r1TeacherLoads[m.dosen_id] = (r1TeacherLoads[m.dosen_id] || 0) + m.sks;
                                    }
                                });
                                const r1SlotsPerHari = Math.max(0, ruleEndSlot - ruleStartSlot + 1);
                                const r1CapBesar = countBesar * totalHari * r1SlotsPerHari;
                                const r1CapKecil = countKecil * totalHari * r1SlotsPerHari;
                                const maxSksPerTeacher1 = r1SlotsPerHari * totalHari;
                                const r1TeacherOverloadCount = Object.values(r1TeacherLoads).filter(load => load > maxSksPerTeacher1).length;
                                const r1Aman = (!ruleActive) || (r1TeacherOverloadCount === 0 && r1CapBesar >= r1ButuhBesar && r1CapKecil >= r1ButuhKecil);

                                // Aturan 2
                                const rMks2 = matakuliahs?.filter((m: any) => rule2MkCodes.includes(m.kode_mk)) || [];
                                let r2ButuhBesar = 0, r2ButuhKecil = 0;
                                const r2TeacherLoads: Record<number, number> = {};
                                rMks2.forEach((m:any) => {
                                    if ((m.jenis_ruang || '').toLowerCase() === 'kecil') r2ButuhKecil += m.sks;
                                    else r2ButuhBesar += m.sks;
                                    if (m.dosen_id) {
                                        r2TeacherLoads[m.dosen_id] = (r2TeacherLoads[m.dosen_id] || 0) + m.sks;
                                    }
                                });
                                const r2SlotsPerHari = Math.max(0, rule2EndSlot - rule2StartSlot + 1);
                                const r2CapBesar = countBesar * totalHari * r2SlotsPerHari;
                                const r2CapKecil = countKecil * totalHari * r2SlotsPerHari;
                                const maxSksPerTeacher2 = r2SlotsPerHari * totalHari;
                                const r2TeacherOverloadCount = Object.values(r2TeacherLoads).filter(load => load > maxSksPerTeacher2).length;
                                const r2Aman = (!rule2Active) || (r2TeacherOverloadCount === 0 && r2CapBesar >= r2ButuhBesar && r2CapKecil >= r2ButuhKecil);

                                const isAman = r1Aman && r2Aman;

                                return (
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800">
                                            <h4 className="font-semibold mb-2 text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-1"><MapPin className="w-4 h-4"/> Ruang Fisik Seminggu</h4>
                                            
                                            <div className="mb-2 text-[11px] flex flex-col gap-1 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                                                <div className="flex justify-between font-semibold border-b pb-1 mb-1">
                                                    <span className="text-blue-700 dark:text-blue-400">Ruang Besar</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Kebutuhan Mapel:</span>
                                                    <span className="font-bold">{butuhBesarTotal} SKS</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Kapasitas Seminggu:</span>
                                                    <span className="font-bold text-emerald-600">{capBesarOverall} Slot</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] italic mt-1 text-gray-500">
                                                    <span>Sisa Nganggur:</span>
                                                    <span className={capBesarOverall > 0 && (capBesarOverall - butuhBesarTotal) < (capBesarOverall * 0.15) ? 'text-red-600 font-bold' : ''}>
                                                        {capBesarOverall - butuhBesarTotal} Slot {capBesarOverall > 0 && (capBesarOverall - butuhBesarTotal) < (capBesarOverall * 0.15) && '(Sangat Mepet, Rawan Fragmentasi)'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-[11px] flex flex-col gap-1 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                                                <div className="flex justify-between font-semibold border-b pb-1 mb-1">
                                                    <span className="text-orange-700 dark:text-orange-400">Ruang Kecil</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Kebutuhan Mapel:</span>
                                                    <span className="font-bold">{butuhKecilTotal} SKS</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Kapasitas Seminggu:</span>
                                                    <span className="font-bold text-emerald-600">{capKecilOverall} Slot</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] italic mt-1 text-gray-500">
                                                    <span>Sisa Nganggur:</span>
                                                    <span className={capKecilOverall > 0 && (capKecilOverall - butuhKecilTotal) < (capKecilOverall * 0.15) ? 'text-red-600 font-bold' : ''}>
                                                        {capKecilOverall - butuhKecilTotal} Slot {capKecilOverall > 0 && (capKecilOverall - butuhKecilTotal) < (capKecilOverall * 0.15) && '(Sangat Mepet, Rawan Fragmentasi)'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`rounded-lg bg-white p-3 shadow-sm border ${isAman ? 'border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50' : 'border-red-200 dark:border-red-900/50 dark:bg-red-950/30'}`}>
                                            <h4 className={`font-semibold mb-2 text-sm flex items-center gap-1 ${isAman ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>
                                                <Clock className="w-4 h-4"/> Analisis Batasan Jam
                                            </h4>
                                            
                                            {ruleActive ? (
                                                <div className="mb-2 text-[10px] flex flex-col gap-1 bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded border border-gray-100 dark:border-gray-700">
                                                    <span className="font-semibold text-[11px] border-b pb-1 mb-1 text-gray-700 dark:text-gray-300">Aturan 1 (Jam {ruleStartSlot}-{ruleEndSlot})</span>
                                                    <div className="flex justify-between">
                                                        <span>Ruang Besar:</span>
                                                        <span className={r1CapBesar >= r1ButuhBesar ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                                                            {r1ButuhBesar} / {r1CapBesar} {r1CapBesar >= r1ButuhBesar ? '(Aman)' : `(-${r1ButuhBesar - r1CapBesar})`}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Ruang Kecil:</span>
                                                        <span className={r1CapKecil >= r1ButuhKecil ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                                                            {r1ButuhKecil} / {r1CapKecil} {r1CapKecil >= r1ButuhKecil ? '(Aman)' : `(-${r1ButuhKecil - r1CapKecil})`}
                                                        </span>
                                                    </div>
                                                    {r1TeacherOverloadCount > 0 && (
                                                        <div className="mt-1 pt-1 border-t border-red-200 flex justify-between font-bold text-red-600 dark:text-red-400">
                                                            <span>⚠️ Dosen Overload:</span>
                                                            <span>{r1TeacherOverloadCount} Org &gt; {maxSksPerTeacher1} SKS</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="mb-2 text-[11px] text-muted-foreground italic bg-gray-50 dark:bg-gray-800/50 p-2 rounded">Aturan 1 Nonaktif</div>
                                            )}

                                            {rule2Active ? (
                                                <div className="mb-2 text-[10px] flex flex-col gap-1 bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded border border-gray-100 dark:border-gray-700">
                                                    <span className="font-semibold text-[11px] border-b pb-1 mb-1 text-gray-700 dark:text-gray-300">Aturan 2 (Jam {rule2StartSlot}-{rule2EndSlot})</span>
                                                    <div className="flex justify-between">
                                                        <span>Ruang Besar:</span>
                                                        <span className={r2CapBesar >= r2ButuhBesar ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                                                            {r2ButuhBesar} / {r2CapBesar} {r2CapBesar >= r2ButuhBesar ? '(Aman)' : `(-${r2ButuhBesar - r2CapBesar})`}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Ruang Kecil:</span>
                                                        <span className={r2CapKecil >= r2ButuhKecil ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                                                            {r2ButuhKecil} / {r2CapKecil} {r2CapKecil >= r2ButuhKecil ? '(Aman)' : `(-${r2ButuhKecil - r2CapKecil})`}
                                                        </span>
                                                    </div>
                                                    {r2TeacherOverloadCount > 0 && (
                                                        <div className="mt-1 pt-1 border-t border-red-200 flex justify-between font-bold text-red-600 dark:text-red-400">
                                                            <span>⚠️ Dosen Overload:</span>
                                                            <span>{r2TeacherOverloadCount} Org &gt; {maxSksPerTeacher2} SKS</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="mb-2 text-[11px] text-muted-foreground italic bg-gray-50 dark:bg-gray-800/50 p-2 rounded">Aturan 2 Nonaktif</div>
                                            )}

                                            <p className={`text-[11px] font-medium mt-2 ${isAman ? ((capBesarOverall > 0 && (capBesarOverall - butuhBesarTotal) < (capBesarOverall * 0.15)) ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-700 dark:text-emerald-400') : 'text-red-600 dark:text-red-400'}`}>
                                                Status: {isAman ? ((capBesarOverall > 0 && (capBesarOverall - butuhBesarTotal) < (capBesarOverall * 0.15)) ? 'Peringatan: Sisa ruang mepet. Bisa terjadi konflik jika slot kosong terpecah-pecah (fragmentasi).' : 'Semua Kondisi Mencukupi (Aman)') : 'Peringatan: Ada Kapasitas/Dosen yang Overload!'}
                                            </p>
                                        </div>

                                        <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800">
                                            <h4 className="font-semibold mb-2 text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-1"><Users className="w-4 h-4"/> Beban Dosen (Rule 3)</h4>
                                            
                                            <div className="text-[11px] flex flex-col gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                                                <div className="flex justify-between">
                                                    <span>Total SKS Keseluruhan:</span>
                                                    <span className="font-bold">{readiness_data.total_sks_mapel} SKS</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Total Dosen Tersedia:</span>
                                                    <span className="font-bold">{readiness_data.total_guru} Orang</span>
                                                </div>
                                                <div className="flex justify-between border-t pt-1 mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                                                    <span>Rata-rata Beban:</span>
                                                    <span>{readiness_data.total_guru > 0 ? Math.ceil(readiness_data.total_sks_mapel / readiness_data.total_guru) : 0} SKS/Minggu</span>
                                                </div>
                                            </div>

                                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-3">
                                                Batas <strong>{rule3Active ? '6' : 'Unlimited'} SKS/Hari</strong> sangat aman karena rata-rata beban jauh di bawah batas. Sistem akan memecah jadwal ke hari lain dengan lancar.
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Actions */}
                        <div className="mb-6 flex gap-3">
                            <button
                                onClick={handlePlot}
                                className="flex items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700"
                            >
                                <Play className="h-4 w-4" /> Plot Otomatis
                            </button>
                            <button
                                onClick={handleResetPlot}
                                className="flex items-center gap-2 rounded bg-orange-500 px-4 py-2 text-white shadow hover:bg-orange-600"
                            >
                                <RefreshCw className="h-4 w-4" /> Reset Plot
                            </button>
                            <button
                                onClick={handleResetAll}
                                className="flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-white shadow hover:bg-red-700"
                            >
                                <Trash2 className="h-4 w-4" /> Reset Semua
                            </button>
                            <button
                                onClick={handleExport}
                                className="ml-auto flex items-center gap-2 rounded bg-slate-800 px-4 py-2 text-white shadow hover:bg-slate-900"
                            >
                                <Download className="h-4 w-4" /> Export CSV
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="border-border mb-4 flex gap-6 border-b px-2">
                            <button
                                className={`pb-2 font-semibold transition-colors ${activeTab === 'mapel' ? 'border-primary text-primary border-b-2' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setActiveTab('mapel')}
                            >
                                Berdasarkan Kelas/Mapel
                            </button>
                            <button
                                className={`pb-2 font-semibold transition-colors ${activeTab === 'dosen' ? 'border-primary text-primary border-b-2' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setActiveTab('dosen')}
                            >
                                Berdasarkan Pendidik
                            </button>
                            <button
                                className={`pb-2 font-semibold transition-colors ${activeTab === 'ruang' ? 'border-primary text-primary border-b-2' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setActiveTab('ruang')}
                            >
                                Berdasarkan Ruangan
                            </button>
                        </div>
                        {/* Table or Grouped View */}
                        {activeTab === 'mapel' && (
                            <TabMapel
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                filterStatus={filterStatus}
                                setFilterStatus={setFilterStatus}
                                sortConfig={sortConfig}
                                requestSort={requestSort}
                                sortedPlots={sortedPlots}
                                setEditPlot={setEditPlot}
                                setEditData={setEditData}
                                setEditTimes={setEditTimes}
                            />
                        )}

                        {activeTab === 'dosen' && (
                            <TabPendidik
                                dosens={dosens}
                                plots={plots}
                                rule3Active={rule3Active}
                                setEditPlot={setEditPlot}
                                setEditData={setEditData}
                                setEditTimes={setEditTimes}
                            />
                        )}

                        {activeTab === 'ruang' && (
                            <TabRuangan
                                ruangs={ruangs}
                                plots={plots}
                                waktus={waktus}
                                setEditPlot={setEditPlot}
                                setEditData={setEditData}
                                setEditTimes={setEditTimes}
                            />
                        )}
                    </>
                )}

                {/* Edit Modal */}
                {editPlot &&
                    typeof document !== 'undefined' &&
                    createPortal(
                        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
                            <div className="bg-card text-card-foreground border-border relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border p-6 shadow-2xl">
                                <h3 className="mb-2 text-xl font-bold">Edit Plot Manual</h3>
                                <p className="text-muted-foreground mb-6 text-sm">
                                    Mapel:{' '}
                                    <span className="text-foreground font-bold">
                                        {editPlot.matakuliah.kode_mk} - {editPlot.matakuliah.nama_mk} ({editPlot.matakuliah.sks} PJ)
                                    </span>
                                </p>

                                <form onSubmit={submitEdit} className="flex-1 overflow-y-auto pr-2">
                                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                        {/* Left Column: Form Inputs */}
                                        <div className="space-y-5">
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium">Pendidik</label>
                                                <select
                                                    className="border-input focus:ring-primary w-full rounded-md border bg-white p-2.5 text-slate-900 shadow-sm focus:ring-2 dark:bg-slate-950 dark:text-slate-50"
                                                    value={editData.krs_dosen_id}
                                                    onChange={(e) => setEditData('krs_dosen_id', e.target.value)}
                                                >
                                                    <option value="">-- Pilih Pendidik --</option>
                                                    {dosens
                                                        .filter((d: any) => d.kode_mk === editPlot.matakuliah.kode_mk)
                                                        .map((d: any) => (
                                                            <option key={d.id} value={d.id}>
                                                                {d.nama_dosen}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium">Ruang</label>
                                                <select
                                                    className="border-input focus:ring-primary w-full rounded-md border bg-white p-2.5 text-slate-900 shadow-sm focus:ring-2 dark:bg-slate-950 dark:text-slate-50"
                                                    value={editData.krs_ruang_id}
                                                    onChange={(e) => setEditData('krs_ruang_id', e.target.value)}
                                                >
                                                    <option value="">-- Pilih Ruang --</option>
                                                    {ruangs.map((r: any) => (
                                                        <option key={r.id} value={r.id}>
                                                            {r.nama_ruang}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium">Hari</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((hariStr) => {
                                                        // Count how many slots are taken overall on this day?
                                                        // For now, just render nice buttons
                                                        const isSelected = editData.hari === hariStr;
                                                        return (
                                                            <button
                                                                key={hariStr}
                                                                type="button"
                                                                onClick={() => setEditData('hari', hariStr)}
                                                                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input hover:bg-muted text-foreground'}`}
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
                                            <div className="mb-3 flex items-center justify-between">
                                                <label className="block text-sm font-medium">
                                                    Pilih Waktu (Butuh {editPlot.matakuliah.sks} Slot)
                                                </label>
                                                <span className="text-muted-foreground text-xs">Klik slot untuk memilih</span>
                                            </div>

                                            <div className="grid max-h-[300px] grid-cols-2 gap-2 overflow-y-auto p-1">
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

                                                    let btnClass = 'border border-input bg-background hover:border-primary/50 text-foreground';
                                                    let icon = null;

                                                    let isJumatanSlot = false;
                                                    if (editData.hari === 'Jumat') {
                                                        const m = mulai.length === 5 ? mulai + ':00' : mulai;
                                                        const s = selesai.length === 5 ? selesai + ':00' : selesai;
                                                        if (m <= '12:19:00' && s >= '11:41:00') {
                                                            isJumatanSlot = true;
                                                        }
                                                    }

                                                    let btnContent: any = timeStr;
                                                    let isDisabled = false;

                                                    if (isJumatanSlot) {
                                                        btnClass =
                                                            'border-red-300 bg-red-100 text-red-800 dark:bg-red-900/40 dark:border-red-800 dark:text-red-300 cursor-not-allowed font-semibold';
                                                        btnContent = (
                                                            <>
                                                                <span className="line-through opacity-70">{timeStr}</span> <br />
                                                                <span className="text-[10px]">Jumatan</span>
                                                            </>
                                                        );
                                                        isDisabled = true;
                                                    } else if (isSelected) {
                                                        if (takenDosen || takenRuang) {
                                                            btnClass =
                                                                'border-red-500 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-2 ring-red-500 ring-offset-1';
                                                        } else {
                                                            btnClass =
                                                                'border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1';
                                                        }
                                                    } else if (takenDosen && takenRuang) {
                                                        btnClass =
                                                            'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900 text-red-600 dark:text-red-400 opacity-60';
                                                    } else if (takenDosen) {
                                                        btnClass =
                                                            'border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-900 text-orange-600 dark:text-orange-400 opacity-70';
                                                    } else if (takenRuang) {
                                                        btnClass =
                                                            'border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-900 text-amber-600 dark:text-amber-400 opacity-70';
                                                    }

                                                    return (
                                                        <button
                                                            key={timeStr}
                                                            type="button"
                                                            onClick={() => {
                                                                if (isDisabled) return;
                                                                let newTimes = [...editTimes];
                                                                const isSelected = newTimes.includes(timeStr);

                                                                if (!isSelected) {
                                                                    if (editPlot?.matakuliah?.sks) {
                                                                        const sks = editPlot.matakuliah.sks;
                                                                        const clickedIndex = uniqueWaktuStrings.indexOf(timeStr);
                                                                        if (clickedIndex !== -1) {
                                                                            const tempTimes = [];
                                                                            let currentIndex = clickedIndex;
                                                                            while (
                                                                                tempTimes.length < sks &&
                                                                                currentIndex < uniqueWaktuStrings.length
                                                                            ) {
                                                                                const tStr = uniqueWaktuStrings[currentIndex];
                                                                                const [mStr, sStr] = tStr.split(' - ');
                                                                                const mt = mStr.length === 5 ? mStr + ':00' : mStr;
                                                                                const st = sStr.length === 5 ? sStr + ':00' : sStr;
                                                                                if (
                                                                                    !(
                                                                                        editData.hari === 'Jumat' &&
                                                                                        mt <= '12:19:00' &&
                                                                                        st >= '11:41:00'
                                                                                    )
                                                                                ) {
                                                                                    tempTimes.push(tStr);
                                                                                }
                                                                                currentIndex++;
                                                                            }
                                                                            newTimes = tempTimes;
                                                                        }
                                                                    } else {
                                                                        newTimes.push(timeStr);
                                                                    }
                                                                } else {
                                                                    newTimes = newTimes.filter((t) => t !== timeStr);
                                                                }

                                                                setEditTimes(newTimes);
                                                                const resolvedIds = newTimes
                                                                    .map((ts) => {
                                                                        const [m, s] = ts.split(' - ');
                                                                        const matched = waktus.find(
                                                                            (w: any) => w.jam_mulai === m && w.jam_selesai === s,
                                                                        );
                                                                        return matched ? matched.id : null;
                                                                    })
                                                                    .filter((id) => id !== null);
                                                                setEditData('krs_waktu_ids', resolvedIds as number[]);
                                                            }}
                                                            disabled={isDisabled}
                                                            className={`rounded-md p-2 text-left text-xs transition-all ${btnClass}`}
                                                        >
                                                            <div className="flex items-center justify-between font-semibold">{btnContent}</div>
                                                            {!isJumatanSlot && (
                                                                <div className="mt-1 text-[10px] leading-tight">
                                                                    {takenDosen && takenRuang
                                                                        ? 'Pendidik & Ruang Terpakai'
                                                                        : takenDosen
                                                                          ? 'Pendidik Mengajar'
                                                                          : takenRuang
                                                                            ? 'Ruang Terpakai'
                                                                            : 'Tersedia'}
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <div className="text-muted-foreground bg-muted/50 border-border mt-4 flex flex-wrap gap-3 rounded border p-2 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <span className="bg-background border-input block h-3 w-3 rounded-sm border"></span> Tersedia
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="bg-primary block h-3 w-3 rounded-sm"></span> Dipilih (OK)
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="block h-3 w-3 rounded-sm border border-orange-200 bg-orange-100"></span> Pendidik
                                                    Terpakai
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="block h-3 w-3 rounded-sm border border-amber-200 bg-amber-100"></span> Ruang
                                                    Terpakai
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="block h-3 w-3 rounded-sm bg-red-500"></span> Dipilih (Bentrok!)
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-border mt-8 flex justify-end gap-2 border-t pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setEditPlot(null)}
                                            className="border-input hover:bg-muted text-foreground rounded border px-4 py-2 font-medium transition-colors"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            className="rounded bg-blue-600 px-6 py-2 font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                                        >
                                            Simpan Jadwal
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>,
                        document.body,
                    )}

                {/* Master Data View Modal */}
                {viewMasterData &&
                    typeof document !== 'undefined' &&
                    createPortal(
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                            <div className="bg-background text-foreground border-border relative z-[10000] flex max-h-[90vh] w-[700px] max-w-[95vw] flex-col rounded-xl border shadow-2xl">
                                <div className="border-border flex items-center justify-between border-b p-6">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-lg font-bold capitalize">Data Master: {viewMasterData}</h3>
                                        {activePeriodId && (
                                            <div className="flex items-center gap-2">
                                                {viewMasterData === 'dosen' && (
                                                    <button
                                                        onClick={() => {
                                                            if (
                                                                confirm(
                                                                    'Sistem akan menghitung ulang total PJ dari setiap Mapel dan membaginya rata kepada SEMUA pendidik pengampu secara adil (peringatan: batas PJ manual yang sudah ada akan tertimpa). Lanjutkan?',
                                                                )
                                                            ) {
                                                                router.post(
                                                                    route('admin.krs.master_data.dosen.auto_sks'),
                                                                    {
                                                                        period_id: activePeriodId,
                                                                    },
                                                                    {
                                                                        preserveScroll: true,
                                                                        onSuccess: () => alert('Pembagian PJ Otomatis selesai.'),
                                                                    },
                                                                );
                                                            }
                                                        }}
                                                        className="flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-200 dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
                                                    >
                                                        <Calculator className="h-3 w-3" /> Bagi Rata PJ Otomatis
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (
                                                            confirm(`Yakin ingin menghapus SEMUA data ${viewMasterData}? Ini tidak dapat dibatalkan.`)
                                                        ) {
                                                            router.post(
                                                                route('admin.krs.master_data.delete'),
                                                                {
                                                                    period_id: activePeriodId,
                                                                    type: viewMasterData,
                                                                },
                                                                {
                                                                    onSuccess: () => setViewMasterData(null),
                                                                },
                                                            );
                                                        }
                                                    }}
                                                    className="flex items-center gap-1 rounded-md border border-red-200 bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-200 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
                                                >
                                                    <Trash2 className="h-3 w-3" /> Hapus Semua
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setViewMasterData(null)}
                                        className="text-muted-foreground hover:text-foreground text-2xl leading-none"
                                    >
                                        &times;
                                    </button>
                                </div>
                                <div className="border-border bg-muted/10 flex-1 overflow-auto border-b">
                                    {viewMasterData === 'waktu' ? (
                                        <div className="p-6">
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const formData = new FormData(e.currentTarget);
                                                    router.post(
                                                        route('admin.krs.period.hari_aktif'),
                                                        {
                                                            period_id: activePeriodId,
                                                            hari_aktif: formData.getAll('hari_aktif[]'),
                                                        },
                                                        {
                                                            preserveScroll: true,
                                                            onSuccess: () => alert('Hari Aktif berhasil disimpan!'),
                                                        },
                                                    );
                                                }}
                                                className="bg-card border-border mb-6 rounded-lg border p-5 shadow-sm"
                                            >
                                                <div className="mb-4 flex items-center justify-between border-b pb-2">
                                                    <h4 className="font-bold">Pengaturan Hari Aktif</h4>
                                                    <button
                                                        type="submit"
                                                        className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
                                                    >
                                                        Simpan Hari Aktif
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-4">
                                                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((h) => {
                                                        const currentPeriod = periods.find((p: any) => p.id === parseInt(activePeriodId));
                                                        const isChecked = currentPeriod?.hari_aktif
                                                            ? currentPeriod.hari_aktif.includes(h)
                                                            : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].includes(h);
                                                        return (
                                                            <label key={h} className="flex cursor-pointer items-center gap-1.5 text-sm">
                                                                <input
                                                                    type="checkbox"
                                                                    name="hari_aktif[]"
                                                                    value={h}
                                                                    defaultChecked={isChecked}
                                                                    className="border-input text-primary focus:ring-primary rounded"
                                                                />{' '}
                                                                {h}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </form>

                                            <form
                                                onSubmit={(e) => {
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
                                                        onSuccess: () => alert('Berhasil di-generate!'),
                                                    });
                                                }}
                                                className="bg-card border-border rounded-lg border p-5 shadow-sm"
                                            >
                                                <h4 className="mb-4 border-b pb-2 font-bold">Form Generator Otomatis Waktu</h4>
                                                <div className="mb-4 grid grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium">Jam Mulai Pertama</label>
                                                        <input
                                                            type="time"
                                                            name="jam_mulai"
                                                            required
                                                            value={genJamMulai}
                                                            onChange={(e) => setGenJamMulai(e.target.value)}
                                                            className="border-input bg-background w-full rounded border p-2"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium">Durasi 1 PJ (Menit)</label>
                                                        <input
                                                            type="number"
                                                            name="durasi_sks"
                                                            required
                                                            value={genDurasi}
                                                            onChange={(e) => setGenDurasi(parseInt(e.target.value))}
                                                            min={1}
                                                            className="border-input bg-background w-full rounded border p-2"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium">Total Slot (Per Hari)</label>
                                                        <input
                                                            type="number"
                                                            name="jumlah_slot"
                                                            required
                                                            value={genSlot}
                                                            onChange={(e) => setGenSlot(parseInt(e.target.value))}
                                                            min={1}
                                                            max={30}
                                                            className="border-input bg-background w-full rounded border p-2"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="border-border bg-background mb-4 rounded-lg border p-4">
                                                    <label className="mb-3 flex cursor-pointer items-center gap-2 font-medium">
                                                        <input
                                                            type="checkbox"
                                                            name="is_istirahat"
                                                            id="is_istirahat_chk"
                                                            className="text-primary rounded"
                                                            checked={genIsIstirahat}
                                                            onChange={(e) => setGenIsIstirahat(e.target.checked)}
                                                        />
                                                        Ada Jam Istirahat?
                                                    </label>
                                                    {genIsIstirahat && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium">Mulai Istirahat</label>
                                                                <input
                                                                    type="time"
                                                                    name="istirahat_mulai"
                                                                    value={genIstirahatMulai}
                                                                    onChange={(e) => setGenIstirahatMulai(e.target.value)}
                                                                    className="border-input bg-background w-full rounded border p-2"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium">Selesai Istirahat</label>
                                                                <input
                                                                    type="time"
                                                                    name="istirahat_selesai"
                                                                    value={genIstirahatSelesai}
                                                                    onChange={(e) => setGenIstirahatSelesai(e.target.value)}
                                                                    className="border-input bg-background w-full rounded border p-2"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <p className="text-muted-foreground mt-2 text-xs italic">
                                                        * Jika waktu jam pelajaran bersinggungan dengan jam istirahat, sistem akan otomatis melompati
                                                        jam istirahat tersebut.
                                                    </p>
                                                </div>

                                                {finalTimeStr && (
                                                    <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                        <span>Estimasi Jam Berakhir:</span>
                                                        <span className="text-lg font-bold">{finalTimeStr}</span>
                                                    </div>
                                                )}

                                                <button
                                                    type="submit"
                                                    className="bg-primary hover:bg-primary/90 text-primary-foreground w-full rounded px-4 py-2 font-semibold shadow-sm"
                                                >
                                                    Generate Waktu Sekarang
                                                </button>
                                            </form>

                                            <div className="mt-8 mb-4 flex items-center justify-between">
                                                <h4 className="font-bold">Daftar Waktu Tersimpan ({waktus.length})</h4>
                                            </div>
                                            <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400">
                                                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                                <div>
                                                    <strong>Peringatan Penting:</strong> Daftar di bawah ini <u>hanya boleh</u> berisi jam pelajaran
                                                    (JP) efektif.
                                                    <strong> JANGAN memasukkan/menambah baris khusus untuk Jam Istirahat.</strong>
                                                    <br />
                                                    (Jam Istirahat cukup diatur pada form generator di atas, dan sistem akan otomatis melompatinya
                                                    tanpa perlu dibuatkan slot).
                                                </div>
                                            </div>
                                            <table className="bg-background border-border w-full border-collapse overflow-hidden rounded-lg border text-left text-sm">
                                                <thead className="bg-muted text-muted-foreground border-border border-b">
                                                    <tr>
                                                        <th className="p-3">Jam Mulai</th>
                                                        <th className="p-3">Jam Selesai</th>
                                                        <th className="p-3">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {waktus?.map((w: any) => (
                                                        <tr key={w.id} className="border-border hover:bg-muted/50 border-b last:border-0">
                                                            <td className="p-3">{w.jam_mulai}</td>
                                                            <td className="p-3">{w.jam_selesai}</td>
                                                            <td className="p-3">
                                                                <button
                                                                    onClick={() => handleDeleteMasterData('waktu', w.id)}
                                                                    className="rounded bg-red-50 p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {(!waktus || waktus.length === 0) && (
                                                        <tr>
                                                            <td colSpan={3} className="text-muted-foreground p-4 text-center">
                                                                Belum ada waktu di-generate.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <table className="w-full border-collapse text-left text-sm">
                                            <thead className="bg-muted text-muted-foreground border-border sticky top-0 border-b">
                                                {viewMasterData === 'matakuliah' && (
                                                    <tr>
                                                        <th className="p-3">Kode MP</th>
                                                        <th className="p-3">Nama Mapel</th>
                                                        <th className="p-3">Kelas</th>
                                                        <th className="p-3">PJ</th>
                                                        <th className="p-3">Jenis Ruang</th>
                                                        <th className="p-3">Aksi</th>
                                                    </tr>
                                                )}
                                                {viewMasterData === 'dosen' && (
                                                    <tr>
                                                        <th className="p-3">Pendidik Pengampu</th>
                                                        <th className="p-3">Kode MP</th>
                                                        <th className="p-3">Nama Mapel</th>
                                                        <th className="p-3">Kelas</th>
                                                        <th className="p-3">Max PJ</th>
                                                        <th className="p-3">Aksi</th>
                                                    </tr>
                                                )}
                                                {viewMasterData === 'ruang' && (
                                                    <tr>
                                                        <th className="p-3">Nama Ruang</th>
                                                        <th className="p-3">Kapasitas</th>
                                                        <th className="p-3">Aksi</th>
                                                    </tr>
                                                )}
                                            </thead>
                                            <tbody>
                                                {viewMasterData === 'matakuliah' &&
                                                    matakuliahs?.map((m: any) => (
                                                        <tr key={m.id} className="border-border hover:bg-muted/50 border-b last:border-0">
                                                            <td className="p-3 font-medium">{m.kode_mk}</td>
                                                            <td className="p-3">{m.nama_mk}</td>
                                                            <td className="p-3">{m.kelas}</td>
                                                            <td className="p-3">{m.sks}</td>
                                                            <td className="p-3">{m.jenis_ruang || '-'}</td>
                                                            <td className="p-3">
                                                                <button
                                                                    onClick={() => handleDeleteMasterData('matakuliah', m.id)}
                                                                    className="rounded bg-red-50 p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                {viewMasterData === 'matakuliah' && (
                                                    <tr className="border-border bg-muted/30 border-b">
                                                        <td className="p-3">
                                                            <input
                                                                type="text"
                                                                id="new_mk_kode"
                                                                className="border-input bg-background w-full rounded border p-1 text-sm"
                                                                placeholder="Kode MP"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <input
                                                                type="text"
                                                                id="new_mk_nama"
                                                                className="border-input bg-background w-full rounded border p-1 text-sm"
                                                                placeholder="Nama Mapel"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <input
                                                                type="text"
                                                                id="new_mk_kelas"
                                                                className="border-input bg-background w-full rounded border p-1 text-sm"
                                                                placeholder="Kelas"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <input
                                                                type="number"
                                                                id="new_mk_sks"
                                                                className="border-input bg-background w-full rounded border p-1 text-sm"
                                                                placeholder="PJ"
                                                                min="1"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <input
                                                                type="text"
                                                                id="new_mk_jenis_ruang"
                                                                className="border-input bg-background w-full rounded border p-1 text-sm"
                                                                placeholder="Jenis Ruang"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <button
                                                                onClick={() => {
                                                                    const kode = (document.getElementById('new_mk_kode') as HTMLInputElement).value;
                                                                    const nama = (document.getElementById('new_mk_nama') as HTMLInputElement).value;
                                                                    const kelas = (document.getElementById('new_mk_kelas') as HTMLInputElement).value;
                                                                    const sks = (document.getElementById('new_mk_sks') as HTMLInputElement).value;
                                                                    const jenis_ruang = (
                                                                        document.getElementById('new_mk_jenis_ruang') as HTMLInputElement
                                                                    ).value;
                                                                    if (!kode || !nama || !kelas || !sks) return alert('Lengkapi data');
                                                                    router.post(
                                                                        route('admin.krs.master_data.store'),
                                                                        {
                                                                            period_id: activePeriodId,
                                                                            type: 'matakuliah',
                                                                            kode_mp: kode,
                                                                            nama_mp: nama,
                                                                            kelas: kelas,
                                                                            pj: sks,
                                                                            jenis_ruang: jenis_ruang,
                                                                        },
                                                                        {
                                                                            preserveScroll: true,
                                                                            onSuccess: () => {
                                                                                (document.getElementById('new_mk_kode') as HTMLInputElement).value =
                                                                                    '';
                                                                                (document.getElementById('new_mk_nama') as HTMLInputElement).value =
                                                                                    '';
                                                                                (document.getElementById('new_mk_kelas') as HTMLInputElement).value =
                                                                                    '';
                                                                                (document.getElementById('new_mk_sks') as HTMLInputElement).value =
                                                                                    '';
                                                                            },
                                                                        },
                                                                    );
                                                                }}
                                                                className="text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded px-2 py-1.5 text-xs font-medium"
                                                            >
                                                                Tambah
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )}
                                                {viewMasterData === 'dosen' &&
                                                    dosens?.map((d: any) => {
                                                        const mk = matakuliahs?.find((m: any) => m.kode_mk === d.kode_mk);
                                                        return (
                                                            <tr key={d.id} className="border-border hover:bg-muted/50 border-b last:border-0">
                                                                <td className="p-3 font-medium">{d.nama_dosen}</td>
                                                                <td className="p-3">{d.kode_mk}</td>
                                                                <td className="p-3">{mk ? mk.nama_mk : '-'}</td>
                                                                <td className="p-3">{d.kelas || '-'}</td>
                                                                <td className="p-3">
                                                                    <input
                                                                        type="number"
                                                                        className="border-input bg-background w-20 rounded border p-1 text-sm"
                                                                        defaultValue={d.max_sks || ''}
                                                                        placeholder="Unlimit"
                                                                        onBlur={(e) => {
                                                                            const val = e.target.value;
                                                                            if (val !== String(d.max_sks || '')) {
                                                                                router.put(
                                                                                    route('admin.krs.master_data.dosen.update_sks', d.id),
                                                                                    { max_sks: val },
                                                                                    {
                                                                                        preserveScroll: true,
                                                                                        onSuccess: () =>
                                                                                            alert(
                                                                                                'Batas PJ ' + d.nama_dosen + ' berhasil diperbarui.',
                                                                                            ),
                                                                                    },
                                                                                );
                                                                            }
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td className="p-3">
                                                                    <button
                                                                        onClick={() => handleDeleteMasterData('dosen', d.id)}
                                                                        className="rounded bg-red-50 p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                {viewMasterData === 'dosen' && (
                                                    <tr className="border-border bg-muted/30 border-b">
                                                        <td className="p-3">
                                                            <input
                                                                type="text"
                                                                id="new_dsn_nama"
                                                                className="border-input bg-background w-full rounded border p-1 text-sm"
                                                                placeholder="Nama Pendidik"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <input
                                                                type="text"
                                                                id="new_dsn_kode"
                                                                className="border-input bg-background w-full rounded border p-1 text-sm"
                                                                placeholder="Kode MP"
                                                            />
                                                        </td>
                                                        <td className="p-3">-</td>
                                                        <td className="p-3">
                                                            <input
                                                                type="text"
                                                                id="new_dsn_kelas"
                                                                className="border-input bg-background w-full rounded border p-1 text-sm"
                                                                placeholder="Kelas"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <input
                                                                type="number"
                                                                id="new_dsn_sks"
                                                                className="border-input bg-background w-full rounded border p-1 text-sm"
                                                                placeholder="Max PJ"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <button
                                                                onClick={() => {
                                                                    const nama = (document.getElementById('new_dsn_nama') as HTMLInputElement).value;
                                                                    const kode = (document.getElementById('new_dsn_kode') as HTMLInputElement).value;
                                                                    const kelas = (document.getElementById('new_dsn_kelas') as HTMLInputElement)
                                                                        .value;
                                                                    const sks = (document.getElementById('new_dsn_sks') as HTMLInputElement).value;
                                                                    if (!nama || !kode) return alert('Lengkapi data');
                                                                    router.post(
                                                                        route('admin.krs.master_data.store'),
                                                                        {
                                                                            period_id: activePeriodId,
                                                                            type: 'dosen',
                                                                            nama_pendidik: nama,
                                                                            kode_mp: kode,
                                                                            kelas: kelas,
                                                                            max_pj: sks || null,
                                                                        },
                                                                        {
                                                                            preserveScroll: true,
                                                                            onSuccess: () => {
                                                                                (document.getElementById('new_dsn_nama') as HTMLInputElement).value =
                                                                                    '';
                                                                                (document.getElementById('new_dsn_kode') as HTMLInputElement).value =
                                                                                    '';
                                                                                (document.getElementById('new_dsn_kelas') as HTMLInputElement).value =
                                                                                    '';
                                                                                (document.getElementById('new_dsn_sks') as HTMLInputElement).value =
                                                                                    '';
                                                                            },
                                                                        },
                                                                    );
                                                                }}
                                                                className="text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded px-2 py-1.5 text-xs font-medium"
                                                            >
                                                                Tambah
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )}
                                                {viewMasterData === 'ruang' &&
                                                    ruangs?.map((r: any) => (
                                                        <tr key={r.id} className="border-border hover:bg-muted/50 border-b last:border-0">
                                                            <td className="p-3 font-medium">{r.nama_ruang}</td>
                                                            <td className="p-3">{r.kapasitas}</td>
                                                            <td className="p-3">
                                                                <button
                                                                    onClick={() => handleDeleteMasterData('ruang', r.id)}
                                                                    className="rounded bg-red-50 p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                {viewMasterData === 'ruang' && (
                                                    <tr className="border-border bg-muted/30 border-b">
                                                        <td className="p-3">
                                                            <input
                                                                type="text"
                                                                id="new_rng_nama"
                                                                className="border-input bg-background w-full rounded border p-1 text-sm"
                                                                placeholder="Nama Ruang"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <input
                                                                type="text"
                                                                id="new_rng_kapasitas"
                                                                className="border-input bg-background w-full rounded border p-1 text-sm"
                                                                placeholder="Kapasitas"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <button
                                                                onClick={() => {
                                                                    const nama = (document.getElementById('new_rng_nama') as HTMLInputElement).value;
                                                                    const kap = (document.getElementById('new_rng_kapasitas') as HTMLInputElement)
                                                                        .value;
                                                                    if (!nama || !kap) return alert('Lengkapi data');
                                                                    router.post(
                                                                        route('admin.krs.master_data.store'),
                                                                        {
                                                                            period_id: activePeriodId,
                                                                            type: 'ruang',
                                                                            nama_ruang: nama,
                                                                            kapasitas: kap,
                                                                        },
                                                                        {
                                                                            preserveScroll: true,
                                                                            onSuccess: () => {
                                                                                (document.getElementById('new_rng_nama') as HTMLInputElement).value =
                                                                                    '';
                                                                                (
                                                                                    document.getElementById('new_rng_kapasitas') as HTMLInputElement
                                                                                ).value = '';
                                                                            },
                                                                        },
                                                                    );
                                                                }}
                                                                className="text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded px-2 py-1.5 text-xs font-medium"
                                                            >
                                                                Tambah
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                <div className="border-border mt-4 flex justify-end border-t p-6 pt-0 pt-4">
                                    <button
                                        onClick={() => setViewMasterData(null)}
                                        className="border-input hover:bg-muted text-foreground rounded border px-4 py-2 transition-colors"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body,
                    )}

                {/* Plot Streaming Modal */}
                {isPlotting && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-xl border shadow-xl flex flex-col max-h-[80vh]">
                            <div className="border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6 pb-4">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                                    AI Plot Optimizer...
                                </h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Membongkar pasang jadwal untuk meminimalisir bentrok & overload...
                                </p>
                            </div>
                            
                            <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-mono text-sm flex flex-col gap-2 bg-slate-950 text-slate-300">
                                {plotLogs.length === 0 ? (
                                    <div className="text-slate-500 italic">Menyambungkan ke engine...</div>
                                ) : (
                                    plotLogs.map((log, i) => (
                                        <div key={i} className={`flex gap-3 ${log.score === 0 ? 'text-emerald-400 font-bold' : log.message.includes('Selesai') ? 'text-indigo-400' : ''}`}>
                                            <span className="text-slate-500 shrink-0">[{log.iteration ? log.iteration.toString().padStart(2, '0') : '✓'}]</span>
                                            <span>{log.message}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
