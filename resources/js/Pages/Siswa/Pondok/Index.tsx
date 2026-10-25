import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Home,
    BookOpen,
    CheckCircle2,
    Calendar,
    Clock,
    User,
    Users,
    Sparkles,
    AlertCircle,
    RotateCcw,
    BookmarkCheck,
    ScrollText,
    HeartHandshake,
    ShieldCheck,
    Bed,
    School,
    GraduationCap,
    Moon,
} from 'lucide-react';

interface Pembina {
    id: number;
    name: string;
    email: string;
}

interface TemanSekamar {
    id: number;
    name: string;
    email: string;
    jenis_kelamin: string | null;
    rombel: { id: number; name: string } | null;
    madin_kelas: { id: number; nama_kelas: string } | null;
}

interface KamarData {
    id: number;
    nama_kamar: string;
    gedung: string;
    kapasitas: number;
    gender: 'L' | 'P';
    keterangan: string | null;
    pembina: Pembina | null;
}

interface SetoranItem {
    id: number;
    tanggal: string;
    kategori: 'tahfidz_quran' | 'tahfidz_hadits' | 'kitab' | 'amalan';
    kitab_surat: string | null;
    halaman_ayat: string | null;
    status: 'lancar' | 'mengulang' | 'kurang_lancar' | 'absen';
    nilai: number | null;
    catatan: string | null;
    ustadz: { id: number; name: string } | null;
}

interface Props {
    kamar: KamarData | null;
    temanSekamar: TemanSekamar[];
    setorans: {
        data: SetoranItem[];
        current_page: number;
        last_page: number;
        total: number;
    };
    stats: {
        total_setoran: number;
        setoran_bulan_ini: number;
        total_lancar: number;
        persentase_lancar: number;
        terakhir_setor: {
            tanggal: string;
            kategori: string;
            kitab_surat: string | null;
            halaman_ayat: string | null;
            status: string;
        } | null;
    };
    jadwalRutinitas: Array<{
        waktu: string;
        nama: string;
        lokasi: string;
        keterangan: string;
        icon: string;
    }>;
    filters: {
        kategori: string;
    };
}

const KATEGORI_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    tahfidz_quran: { label: "Tahfidz Al-Qur'an", color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
    tahfidz_hadits: { label: 'Hadits Tematik', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800' },
    kitab: { label: 'Kitab Kuning / Sorogan', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
    amalan: { label: 'Doa & Amalan Harian', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
};

const STATUS_BADGES: Record<string, { label: string; icon: any; cls: string }> = {
    lancar: { label: 'Lancar / Mutqin', icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' },
    kurang_lancar: { label: 'Cukup Lancar', icon: AlertCircle, cls: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' },
    mengulang: { label: 'Perlu Muroja\'ah', icon: RotateCcw, cls: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' },
    absen: { label: 'Izin / Sakit', icon: Clock, cls: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
};

export default function SiswaPondokIndex({
    kamar,
    temanSekamar,
    setorans,
    stats,
    jadwalRutinitas,
    filters,
}: Props) {
    const [activeTab, setActiveTab] = useState<'setoran' | 'kamar' | 'rutinitas'>('setoran');
    const [selectedKategori, setSelectedKategori] = useState<string>(filters.kategori ?? 'semua');

    const handleKategoriFilter = (kat: string) => {
        setSelectedKategori(kat);
        router.get(
            route('siswa.pondok.index'),
            { kategori: kat },
            { preserveState: true, replace: true }
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Pondok Pesantren', href: '/siswa/pondok' }]}>
            <Head title="Pondok Pesantren & Mutaba'ah Santri" />

            <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto space-y-8">

                {/* ── Hero Banner ── */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 text-white shadow-xl">
                    <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                    <div className="absolute top-0 right-1/4 w-40 h-40 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />

                    <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/30 backdrop-blur-md border border-emerald-400/30 text-xs font-semibold uppercase tracking-wider text-emerald-100">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                Sistem Pesantren Terpadu Al-Hidayah
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                Pondok Pesantren & Halaqah Santri
                            </h1>
                            <p className="text-emerald-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
                                Pusat pembinaan adab, asrama mukim santri, setoran hafalan Al-Qur'an, Hadits, dan sorogan Kitab Kuning harian.
                            </p>
                        </div>

                        {/* Room Badge */}
                        <div className="flex-shrink-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex items-center gap-4 text-white">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                                <Home className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xs uppercase tracking-wider text-emerald-200 font-semibold block">Kamar Asrama Anda</span>
                                <h3 className="font-bold text-lg leading-tight">
                                    {kamar ? kamar.nama_kamar : 'Belum Ditentukan'}
                                </h3>
                                <p className="text-xs text-emerald-100/80 mt-0.5">
                                    {kamar ? `${kamar.gedung} • Santri ${kamar.gender === 'L' ? 'Putra' : 'Putri'}` : 'Hubungi Musyrif / Admin'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Stat Highlights ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Total Setoran</p>
                            <h3 className="text-2xl font-black text-foreground mt-0.5">{stats.total_setoran} <span className="text-xs font-normal text-muted-foreground">sesi</span></h3>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Bulan Ini</p>
                            <h3 className="text-2xl font-black text-foreground mt-0.5">{stats.setoran_bulan_ini} <span className="text-xs font-normal text-muted-foreground">sesi</span></h3>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Kelancaran</p>
                            <h3 className="text-2xl font-black text-foreground mt-0.5">{stats.persentase_lancar}% <span className="text-xs font-normal text-emerald-600 font-semibold">Mutqin</span></h3>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground font-medium">Terakhir Setor</p>
                            <h3 className="text-sm font-bold text-foreground mt-0.5 truncate">
                                {stats.terakhir_setor ? stats.terakhir_setor.tanggal : 'Belum ada'}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">{stats.terakhir_setor?.kitab_surat ?? '-'}</p>
                        </div>
                    </div>
                </div>

                {/* ── Navigation Tabs ── */}
                <div className="flex border-b border-border gap-2 sm:gap-6">
                    <button
                        onClick={() => setActiveTab('setoran')}
                        className={`pb-3.5 px-2 text-sm sm:text-base font-semibold flex items-center gap-2 border-b-2 transition-all ${
                            activeTab === 'setoran'
                                ? 'border-emerald-600 text-emerald-600'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <ScrollText className="w-4 h-4" />
                        Riwayat Setoran & Mutaba'ah
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            {stats.total_setoran}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('kamar')}
                        className={`pb-3.5 px-2 text-sm sm:text-base font-semibold flex items-center gap-2 border-b-2 transition-all ${
                            activeTab === 'kamar'
                                ? 'border-emerald-600 text-emerald-600'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Home className="w-4 h-4" />
                        Informasi Kamar & Teman
                        {temanSekamar.length > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                                {temanSekamar.length} teman
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('rutinitas')}
                        className={`pb-3.5 px-2 text-sm sm:text-base font-semibold flex items-center gap-2 border-b-2 transition-all ${
                            activeTab === 'rutinitas'
                                ? 'border-emerald-600 text-emerald-600'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Clock className="w-4 h-4" />
                        Jadwal Rutinitas Santri
                    </button>
                </div>

                {/* ── TAB 1: RIWAYAT SETORAN ── */}
                {activeTab === 'setoran' && (
                    <div className="space-y-6">

                        {/* Filter Kategori */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase mr-1">Filter Kategori:</span>
                            {[
                                { key: 'semua', label: 'Semua Kategori' },
                                { key: 'tahfidz_quran', label: "Tahfidz Al-Qur'an" },
                                { key: 'tahfidz_hadits', label: 'Hadits Tematik' },
                                { key: 'kitab', label: 'Kitab Kuning' },
                                { key: 'amalan', label: 'Doa & Amalan' },
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => handleKategoriFilter(item.key)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                        selectedKategori === item.key
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Setorans List */}
                        {setorans.data.length > 0 ? (
                            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                                <div className="divide-y divide-border">
                                    {setorans.data.map(item => {
                                        const katInfo = KATEGORI_LABELS[item.kategori] ?? {
                                            label: item.kategori,
                                            color: 'text-slate-700',
                                            bg: 'bg-slate-100',
                                        };
                                        const statusInfo = STATUS_BADGES[item.status] ?? STATUS_BADGES.lancar;
                                        const StatusIcon = statusInfo.icon;

                                        return (
                                            <div key={item.id} className="p-5 sm:p-6 hover:bg-muted/30 transition-colors">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                    <div className="space-y-2 flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${katInfo.bg} ${katInfo.color}`}>
                                                                {katInfo.label}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {new Date(item.tanggal).toLocaleDateString('id-ID', {
                                                                    day: 'numeric',
                                                                    month: 'long',
                                                                    year: 'numeric',
                                                                })}
                                                            </span>
                                                        </div>

                                                        <div>
                                                            <h4 className="text-base font-bold text-foreground">
                                                                {item.kitab_surat ?? 'Setoran Santri'}
                                                            </h4>
                                                            {item.halaman_ayat && (
                                                                <p className="text-sm text-muted-foreground font-medium mt-0.5">
                                                                    Rincian: <span className="text-foreground">{item.halaman_ayat}</span>
                                                                </p>
                                                            )}
                                                        </div>

                                                        {item.catatan && (
                                                            <div className="p-3 rounded-xl bg-muted/60 text-xs sm:text-sm text-foreground/90 border border-border/60 italic">
                                                                "{item.catatan}"
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Status & Ustadz Column */}
                                                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${statusInfo.cls}`}>
                                                            <StatusIcon className="w-3.5 h-3.5" />
                                                            {statusInfo.label}
                                                        </span>

                                                        {item.nilai !== null && item.nilai !== undefined && (
                                                            <div className="text-right">
                                                                <span className="text-xs text-muted-foreground">Nilai: </span>
                                                                <span className="font-extrabold text-foreground text-sm">{item.nilai}</span>
                                                            </div>
                                                        )}

                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <User className="w-3.5 h-3.5" />
                                                            {item.ustadz ? item.ustadz.name : 'Ustadz Pembina'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16 px-4 border border-dashed border-border rounded-2xl bg-card">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                                    <BookOpen className="w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Belum Ada Catatan Setoran</h3>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                                    Setoran hafalan Al-Qur'an atau kitab Anda akan muncul di sini setelah dicatat oleh Ustadz pembina kamar atau halaqah.
                                </p>
                            </div>
                        )}

                    </div>
                )}

                {/* ── TAB 2: INFORMASI KAMAR & TEMAN SEKAMAR ── */}
                {activeTab === 'kamar' && (
                    <div className="space-y-8">
                        {kamar ? (
                            <>
                                {/* Detail Kamar Card */}
                                <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-sm space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
                                        <div>
                                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Kamar Mukim Santri</span>
                                            <h2 className="text-2xl font-black text-foreground mt-1">{kamar.nama_kamar}</h2>
                                            <p className="text-sm text-muted-foreground mt-0.5">{kamar.gedung}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                                                Santri {kamar.gender === 'L' ? 'Putra' : 'Putri'}
                                            </span>
                                            <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold">
                                                Kapasitas: {kamar.kapasitas} Santri
                                            </span>
                                        </div>
                                    </div>

                                    {/* Musyrif / Pembina Kamar */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                                                <ShieldCheck className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium">Musyrif / Pembina Kamar</p>
                                                <h4 className="font-bold text-foreground text-sm sm:text-base mt-0.5">
                                                    {kamar.pembina ? kamar.pembina.name : 'Ustadz Pembina Belum Ditugaskan'}
                                                </h4>
                                                <p className="text-xs text-muted-foreground">{kamar.pembina?.email ?? 'Hubungi Pengasuh Pondok'}</p>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium">Penghuni Kamar Saat Ini</p>
                                                <h4 className="font-bold text-foreground text-sm sm:text-base mt-0.5">
                                                    {temanSekamar.length + 1} Santri Aktif
                                                </h4>
                                                <p className="text-xs text-muted-foreground">Termasuk Anda di kamar ini</p>
                                            </div>
                                        </div>
                                    </div>

                                    {kamar.keterangan && (
                                        <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/60 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                                            <span className="font-bold">Catatan Kamar: </span>{kamar.keterangan}
                                        </div>
                                    )}
                                </div>

                                {/* Daftar Teman Sekamar */}
                                <div>
                                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-emerald-600" />
                                        Teman Sekamar ({temanSekamar.length})
                                    </h3>

                                    {temanSekamar.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {temanSekamar.map(teman => (
                                                <div
                                                    key={teman.id}
                                                    className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow"
                                                >
                                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                                                        {teman.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-bold text-sm text-foreground truncate">{teman.name}</h4>
                                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                            {teman.rombel && (
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                                                    <School className="w-3 h-3 text-blue-500" />
                                                                    {teman.rombel.name}
                                                                </span>
                                                            )}
                                                            {teman.madin_kelas && (
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                                                                    <GraduationCap className="w-3 h-3" />
                                                                    {teman.madin_kelas.nama_kelas}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 border border-dashed border-border rounded-2xl text-center text-muted-foreground text-sm">
                                            Belum ada santri lain yang diplotkan ke kamar ini selain Anda.
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card">
                                <Home className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                <h3 className="font-bold text-lg text-foreground">Kamar Belum Ditentukan</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                                    Anda belum diplotkan ke kamar asrama. Hubungi Admin Pesantren atau Pembina untuk menentukan kamar Anda.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB 3: JADWAL RUTINITAS SANTRI ── */}
                {activeTab === 'rutinitas' && (
                    <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Jadwal & Rutinitas Santri Harian</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Rangkaian kegiatan ibadah, sekolah formal, madrasah diniyah, dan istirahat santri mukim Pondok Pesantren Al-Hidayah.
                            </p>
                        </div>

                        <div className="relative pl-6 sm:pl-8 border-l-2 border-emerald-500/40 space-y-8 my-4">
                            {jadwalRutinitas.map((item, idx) => (
                                <div key={idx} className="relative group">
                                    {/* Dot pointer */}
                                    <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-5 h-5 rounded-full bg-emerald-600 border-4 border-card group-hover:scale-125 transition-transform" />

                                    <div className="p-4 sm:p-5 rounded-2xl bg-muted/40 border border-border/80 hover:bg-muted/70 transition-colors">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                                            <h4 className="font-bold text-base text-foreground">{item.nama}</h4>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                                                <Clock className="w-3.5 h-3.5" />
                                                {item.waktu}
                                            </span>
                                        </div>
                                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                                            📍 Lokasi: {item.lokasi}
                                        </p>
                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                            {item.keterangan}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
