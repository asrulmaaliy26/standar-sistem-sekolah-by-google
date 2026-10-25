import React, { useState } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ClipboardCheck,
    Plus,
    Search,
    Filter,
    Calendar,
    BookOpen,
    User,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Trash2,
    Home,
    GraduationCap,
    Clock,
    Sparkles,
    X,
    Users,
} from 'lucide-react';

interface SantriUser {
    id: number;
    name: string;
    email: string;
    kamar_id?: number | null;
}

interface KamarOption {
    id: number;
    nama_kamar: string;
    santri: SantriUser[];
}

interface SetoranRow {
    id: number;
    tanggal: string;
    kategori: 'tahfidz_quran' | 'tahfidz_hadits' | 'kitab' | 'amalan';
    kitab_surat: string | null;
    halaman_ayat: string | null;
    status: 'lancar' | 'mengulang' | 'kurang_lancar' | 'absen';
    nilai: number | null;
    catatan: string | null;
    santri: {
        id: number;
        name: string;
        email: string;
        kamar_id: number | null;
        madin_kelas_id: number | null;
        kamar: { id: number; nama_kamar: string } | null;
    } | null;
    ustadz: { id: number; name: string } | null;
}

interface Props {
    setorans: {
        data: SetoranRow[];
        current_page: number;
        last_page: number;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    kamars: KamarOption[];
    allSantri: SantriUser[];
    stats: {
        total_hari_ini: number;
        total_bulan_ini: number;
        santri_aktif_count: number;
    };
    filters: {
        search: string;
        kamar_id: string;
        kategori: string;
        status: string;
        tanggal: string;
    };
}

const KATEGORI_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    tahfidz_quran: { label: "Tahfidz Al-Qur'an", color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
    tahfidz_hadits: { label: 'Hadits Tematik', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800' },
    kitab: { label: 'Kitab Kuning', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
    amalan: { label: 'Doa & Amalan', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
};

const STATUS_BADGES: Record<string, { label: string; icon: any; cls: string }> = {
    lancar: { label: 'Lancar / Mutqin', icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' },
    kurang_lancar: { label: 'Cukup Lancar', icon: AlertCircle, cls: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' },
    mengulang: { label: 'Perlu Muroja\'ah', icon: RotateCcw, cls: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' },
    absen: { label: 'Izin / Sakit', icon: Clock, cls: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
};

export default function PondokSetoranIndex({
    setorans,
    kamars,
    allSantri,
    stats,
    filters,
}: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedKamarFilter, setSelectedKamarFilter] = useState<string>(filters.kamar_id ?? 'all');
    const [selectedKategoriFilter, setSelectedKategoriFilter] = useState<string>(filters.kategori ?? 'all');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>(filters.status ?? 'all');
    const [searchQuery, setSearchQuery] = useState(filters.search ?? '');

    // Form Modal
    const today = new Date().toISOString().split('T')[0];
    const { data, setData, post, processing, errors, reset } = useForm({
        santri_id: '',
        tanggal: today,
        kategori: 'tahfidz_quran',
        kitab_surat: '',
        halaman_ayat: '',
        status: 'lancar',
        nilai: 85,
        catatan: '',
        kamar_helper: '',
    });

    const handleFilterChange = (overrides: Record<string, string> = {}) => {
        router.get(
            window.location.pathname,
            {
                search: searchQuery,
                kamar_id: selectedKamarFilter,
                kategori: selectedKategoriFilter,
                status: selectedStatusFilter,
                ...overrides,
            },
            { preserveState: true, replace: true }
        );
    };

    // Filter santri options in modal based on kamar_helper
    const santriOptionsInModal = data.kamar_helper
        ? (kamars.find(k => String(k.id) === data.kamar_helper)?.santri ?? [])
        : allSantri;

    const handleSubmitSetoran = (e: React.FormEvent) => {
        e.preventDefault();
        post(window.location.pathname, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
            },
        });
    };

    const handleDeleteSetoran = (id: number) => {
        if (!confirm('Hapus catatan setoran santri ini?')) return;
        router.delete(`${window.location.pathname}/${id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Setoran Pondok', href: '#' }]}>
            <Head title="Pusat Setoran & Mutaba'ah Santri" />

            <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 max-w-screen-2xl mx-auto space-y-8">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                                <ClipboardCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                                    Pusat Setoran & Mutaba'ah Santri
                                </h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Catatan harian hafalan Al-Qur'an, Hadits, Kitab Kuning, dan doa santri mukim.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href={route(typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') ? 'admin.pondok.input-kamar' : 'guru.pondok.input-kamar')}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                        >
                            <Home className="w-4 h-4" />
                            Input Setoran Per Kamar
                        </Link>

                        <button
                            onClick={() => {
                                reset();
                                setIsCreateModalOpen(true);
                            }}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-sm border border-border transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Catat Cepat
                        </button>
                    </div>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Setoran Hari Ini</p>
                            <h3 className="text-2xl font-black text-foreground mt-0.5">{stats.total_hari_ini} <span className="text-xs font-normal text-muted-foreground">sesi</span></h3>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Setoran Bulan Ini</p>
                            <h3 className="text-2xl font-black text-foreground mt-0.5">{stats.total_bulan_ini} <span className="text-xs font-normal text-muted-foreground">sesi</span></h3>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center flex-shrink-0">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Santri Aktif Setor</p>
                            <h3 className="text-2xl font-black text-foreground mt-0.5">{stats.santri_aktif_count} <span className="text-xs font-normal text-muted-foreground">santri</span></h3>
                        </div>
                    </div>
                </div>

                {/* ── Filters Bar ── */}
                <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        {/* Search Santri */}
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Cari nama santri..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleFilterChange()}
                                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Kamar Filter */}
                        <select
                            value={selectedKamarFilter}
                            onChange={e => {
                                setSelectedKamarFilter(e.target.value);
                                handleFilterChange({ kamar_id: e.target.value });
                            }}
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="all">Semua Kamar Asrama</option>
                            {kamars.map(k => (
                                <option key={k.id} value={k.id}>{k.nama_kamar}</option>
                            ))}
                        </select>

                        {/* Kategori Filter */}
                        <select
                            value={selectedKategoriFilter}
                            onChange={e => {
                                setSelectedKategoriFilter(e.target.value);
                                handleFilterChange({ kategori: e.target.value });
                            }}
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="all">Semua Kategori</option>
                            <option value="tahfidz_quran">Tahfidz Al-Qur'an</option>
                            <option value="tahfidz_hadits">Hadits Tematik</option>
                            <option value="kitab">Kitab Kuning</option>
                            <option value="amalan">Doa & Amalan</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={selectedStatusFilter}
                            onChange={e => {
                                setSelectedStatusFilter(e.target.value);
                                handleFilterChange({ status: e.target.value });
                            }}
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="all">Semua Status Kelancaran</option>
                            <option value="lancar">Lancar / Mutqin</option>
                            <option value="kurang_lancar">Cukup Lancar</option>
                            <option value="mengulang">Perlu Muroja'ah</option>
                            <option value="absen">Izin / Sakit</option>
                        </select>
                    </div>
                </div>

                {/* ── Table Setoran ── */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm w-full min-w-0">
                    {setorans.data.length > 0 ? (
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                                    <tr>
                                        <th className="py-3 px-3 sm:px-4">Tanggal</th>
                                        <th className="py-3 px-3 sm:px-4">Santri</th>
                                        <th className="py-3 px-3 sm:px-4">Materi</th>
                                        <th className="py-3 px-3 sm:px-4">Status & Nilai</th>
                                        <th className="py-3 px-3 sm:px-4 hidden xl:table-cell">Ustadz Penilai</th>
                                        <th className="py-3 px-3 sm:px-4 hidden lg:table-cell">Catatan</th>
                                        <th className="py-3 px-3 sm:px-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {setorans.data.map(row => {
                                        const katInfo = KATEGORI_LABELS[row.kategori] ?? {
                                            label: row.kategori,
                                            color: 'text-slate-700',
                                            bg: 'bg-slate-100',
                                        };
                                        const statusInfo = STATUS_BADGES[row.status] ?? STATUS_BADGES.lancar;
                                        const StatusIcon = statusInfo.icon;

                                        return (
                                            <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap text-xs text-muted-foreground font-medium">
                                                    {new Date(row.tanggal).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </td>

                                                <td className="py-3.5 px-3 sm:px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                            {row.santri?.name?.charAt(0).toUpperCase() ?? 'S'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-foreground text-xs sm:text-sm truncate">
                                                                {row.santri?.name ?? 'Santri Tidak Ditemukan'}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground truncate">
                                                                {row.santri?.kamar?.nama_kamar ?? 'Kamar belum ditentukan'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-3 sm:px-4">
                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold border ${katInfo.bg} ${katInfo.color} mb-0.5`}>
                                                        {katInfo.label}
                                                    </span>
                                                    <p className="font-bold text-foreground text-xs sm:text-sm">
                                                        {row.kitab_surat ?? '-'}
                                                    </p>
                                                    {row.halaman_ayat && (
                                                        <p className="text-[11px] text-muted-foreground">{row.halaman_ayat}</p>
                                                    )}
                                                </td>

                                                <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${statusInfo.cls}`}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        {statusInfo.label}
                                                    </span>
                                                    {row.nilai !== null && row.nilai !== undefined && (
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            Nilai: <span className="font-bold text-foreground">{row.nilai}</span>
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap text-xs text-muted-foreground hidden xl:table-cell">
                                                    {row.ustadz?.name ?? 'Ustadz Pembina'}
                                                </td>

                                                <td className="py-3.5 px-3 sm:px-4 text-xs text-muted-foreground max-w-xs truncate hidden lg:table-cell">
                                                    {row.catatan ? `"${row.catatan}"` : '-'}
                                                </td>

                                                <td className="py-3.5 px-3 sm:px-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteSetoran(row.id)}
                                                        title="Hapus setoran ini"
                                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16 px-4">
                            <BookOpen className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                            <h3 className="font-bold text-base text-foreground">Tidak Ada Catatan Setoran</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Sesuaikan filter pencarian atau klik "+ Catat Setoran Baru" untuk menambahkan.
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Modal Input Setoran Baru ── */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
                            <div className="flex items-center justify-between border-b border-border pb-4">
                                <div>
                                    <h3 className="font-extrabold text-xl text-foreground">Catat Setoran Santri</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">Input hasil setoran hafalan atau mutaba'ah harian.</p>
                                </div>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitSetoran} className="space-y-4">

                                {/* Filter Cepat Kamar (Opsional) */}
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                                        Pilih Kamar (Untuk Mempersempit Santri)
                                    </label>
                                    <select
                                        value={data.kamar_helper}
                                        onChange={e => {
                                            setData('kamar_helper', e.target.value);
                                            setData('santri_id', '');
                                        }}
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">Semua Kamar / Tampilkan Semua</option>
                                        {kamars.map(k => (
                                            <option key={k.id} value={k.id}>{k.nama_kamar}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Pilih Santri (Wajib) */}
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        Nama Santri <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.santri_id}
                                        onChange={e => setData('santri_id', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">-- Pilih Santri --</option>
                                        {santriOptionsInModal.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                                        ))}
                                    </select>
                                    {errors.santri_id && <p className="text-xs text-rose-500 mt-1">{errors.santri_id}</p>}
                                </div>

                                {/* Tanggal & Kategori */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-foreground mb-1">
                                            Tanggal Setoran <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={data.tanggal}
                                            onChange={e => setData('tanggal', e.target.value)}
                                            required
                                            className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-foreground mb-1">
                                            Kategori <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={data.kategori}
                                            onChange={e => setData('kategori', e.target.value as any)}
                                            required
                                            className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="tahfidz_quran">Tahfidz Al-Qur'an</option>
                                            <option value="tahfidz_hadits">Hadits Tematik</option>
                                            <option value="kitab">Kitab Kuning</option>
                                            <option value="amalan">Doa & Amalan</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Surat / Kitab */}
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        Surat / Nama Kitab <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Surat An-Naba' / Kitab Safinah / Hadits Arbain"
                                        value={data.kitab_surat}
                                        onChange={e => setData('kitab_surat', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                                    />
                                    {errors.kitab_surat && <p className="text-xs text-rose-500 mt-1">{errors.kitab_surat}</p>}
                                </div>

                                {/* Halaman / Ayat */}
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        Rincian Halaman / Ayat
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Ayat 1-40 / Halaman 12-14 / Bab Wudhu"
                                        value={data.halaman_ayat}
                                        onChange={e => setData('halaman_ayat', e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                {/* Status & Nilai */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-foreground mb-1">
                                            Status Kelancaran <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={data.status}
                                            onChange={e => setData('status', e.target.value as any)}
                                            required
                                            className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="lancar">Lancar / Mutqin</option>
                                            <option value="kurang_lancar">Cukup Lancar</option>
                                            <option value="mengulang">Perlu Muroja'ah (Mengulang)</option>
                                            <option value="absen">Izin / Sakit</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-foreground mb-1">
                                            Nilai (0 - 100)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={data.nilai}
                                            onChange={e => setData('nilai', Number(e.target.value))}
                                            className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                {/* Catatan / Evaluasi */}
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        Catatan / Nasehat Ustadz
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Catatan makharijul huruf, tajwid, atau motivasi santri..."
                                        value={data.catatan}
                                        onChange={e => setData('catatan', e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow transition-colors"
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan Catatan Setoran'}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
