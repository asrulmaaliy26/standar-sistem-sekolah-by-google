import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Home,
    ArrowLeft,
    Calendar,
    Users,
    CheckCircle2,
    Clock,
    Sparkles,
    AlertCircle,
    RotateCcw,
    BookOpen,
    School,
    GraduationCap,
    Plus,
    X,
    Building,
    ShieldCheck,
    Check,
} from 'lucide-react';

interface KamarItem {
    id: number;
    nama_kamar: string;
    santri_count: number;
}

interface SelectedKamar {
    id: number;
    nama_kamar: string;
    gedung: string;
    kapasitas: number;
    gender: 'L' | 'P';
    keterangan: string | null;
    pembina: { id: number; name: string; email: string } | null;
}

interface SetoranRecord {
    id: number;
    tanggal: string;
    kategori: 'tahfidz_quran' | 'tahfidz_hadits' | 'kitab' | 'amalan';
    kitab_surat: string | null;
    halaman_ayat: string | null;
    status: 'lancar' | 'mengulang' | 'kurang_lancar' | 'absen';
    nilai: number | null;
    catatan: string | null;
    ustadz?: { id: number; name: string } | null;
}

interface SantriInKamar {
    id: number;
    name: string;
    email: string;
    nis: string | null;
    jenis_kelamin: string | null;
    rombel: { id: number; name: string } | null;
    madin_kelas: { id: number; nama_kelas: string } | null;
    last_setoran: SetoranRecord | null;
    today_setorans: SetoranRecord[];
    has_setor_today: boolean;
}

interface Props {
    kamars: KamarItem[];
    selectedKamar: SelectedKamar | null;
    santris: SantriInKamar[];
    tanggal: string;
    statsKamar: {
        total_santri: number;
        sudah_setor: number;
        belum_setor: number;
        persentase: number;
    };
    backUrl: string;
    postUrl: string;
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

export default function InputKamarSetoran({
    kamars,
    selectedKamar,
    santris,
    tanggal,
    statsKamar,
    backUrl,
    postUrl,
}: Props) {
    const [selectedDate, setSelectedDate] = useState(tanggal);
    const [activeSantri, setActiveSantri] = useState<SantriInKamar | null>(null);

    // Form modal state
    const { data, setData, post, processing, errors, reset } = useForm({
        santri_id: '',
        tanggal: tanggal,
        kategori: 'tahfidz_quran',
        kitab_surat: '',
        halaman_ayat: '',
        status: 'lancar',
        nilai: 95,
        catatan: '',
    });

    const handleKamarSwitch = (kamarId: number) => {
        router.get(
            window.location.pathname,
            { kamar_id: kamarId, tanggal: selectedDate },
            { preserveState: true, replace: true }
        );
    };

    const handleDateChange = (newDate: string) => {
        setSelectedDate(newDate);
        router.get(
            window.location.pathname,
            { kamar_id: selectedKamar?.id, tanggal: newDate },
            { preserveState: true, replace: true }
        );
    };

    const openSetoranModalForSantri = (santri: SantriInKamar) => {
        setActiveSantri(santri);
        setData({
            santri_id: String(santri.id),
            tanggal: selectedDate,
            kategori: santri.last_setoran?.kategori ?? 'tahfidz_quran',
            kitab_surat: santri.last_setoran?.kitab_surat ?? '',
            halaman_ayat: '',
            status: 'lancar',
            nilai: 95,
            catatan: '',
        });
    };

    const handleQuickStatusClick = (status: 'lancar' | 'kurang_lancar' | 'mengulang' | 'absen', defaultNilai: number) => {
        setData(prev => ({
            ...prev,
            status,
            nilai: defaultNilai,
        }));
    };

    const handleSubmitSetoran = (e: React.FormEvent) => {
        e.preventDefault();
        post(postUrl, {
            preserveScroll: true,
            onSuccess: () => {
                setActiveSantri(null);
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Pondok Pesantren', href: backUrl },
            { title: 'Input Setoran Santri', href: '#' },
        ]}>
            <Head title={`Input Setoran - ${selectedKamar?.nama_kamar ?? 'Pondok'}`} />

            <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto space-y-6">

                {/* ── Top Bar: Back & Date Selection ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Link
                        href={backUrl}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Kembali ke Panel Pondok
                    </Link>

                    {/* Date Picker */}
                    <div className="flex items-center gap-2.5 bg-card border border-border px-3.5 py-1.5 rounded-2xl shadow-sm">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-muted-foreground uppercase">Tanggal Sesi:</span>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => handleDateChange(e.target.value)}
                            className="text-xs sm:text-sm font-semibold bg-transparent border-none p-0 focus:ring-0 text-foreground cursor-pointer"
                        />
                    </div>
                </div>

                {/* ── Kamar Switcher Pills ── */}
                <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pilih Kamar Asrama:</span>
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                        {kamars.map(k => {
                            const isSelected = selectedKamar?.id === k.id;
                            return (
                                <button
                                    key={k.id}
                                    onClick={() => handleKamarSwitch(k.id)}
                                    className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
                                        isSelected
                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-emerald-600/30 scale-[1.02]'
                                            : 'bg-card border border-border text-foreground hover:bg-muted/60'
                                    }`}
                                >
                                    <Home className="w-4 h-4" />
                                    {k.nama_kamar}
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {k.santri_count} santri
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Active Kamar Hero & Live Progress ── */}
                {selectedKamar ? (
                    <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-sm space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2.5">
                                    <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                                        Santri {selectedKamar.gender === 'L' ? 'Putra' : 'Putri'}
                                    </span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                                        <Building className="w-3.5 h-3.5" />
                                        {selectedKamar.gedung}
                                    </span>
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                                    {selectedKamar.nama_kamar}
                                </h2>
                                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    Pembina / Musyrif: <span className="font-bold text-foreground">{selectedKamar.pembina?.name ?? 'Belum Ditugaskan'}</span>
                                </p>
                            </div>

                            {/* Progress Counter */}
                            <div className="flex-shrink-0 bg-muted/50 border border-border p-4 sm:p-5 rounded-2xl flex items-center gap-6">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs font-bold text-muted-foreground uppercase">Progres Setoran Hari Ini</span>
                                        <span className="text-xs font-black text-emerald-600">{statsKamar.persentase}%</span>
                                    </div>
                                    <div className="w-48 sm:w-56 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                                            style={{ width: `${statsKamar.persentase}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground pt-0.5">
                                        <span className="font-bold text-foreground">{statsKamar.sudah_setor}</span> dari {statsKamar.total_santri} santri sudah dinilai
                                    </p>
                                </div>

                                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-md">
                                    {statsKamar.sudah_setor}/{statsKamar.total_santri}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 border border-dashed border-border rounded-2xl text-center text-muted-foreground">
                        Pilih kamar asrama di atas untuk menampilkan daftar santri.
                    </div>
                )}

                {/* ── DAFTAR SELURUH SANTRI DI KAMAR (Core List) ── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-600" />
                                Daftar Santri di {selectedKamar?.nama_kamar} ({santris.length})
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                Klik tombol <strong>"Catat Setoran"</strong> pada santri yang maju untuk mencatat surat, ayat, kitab, nilai, dan evaluasi.
                            </p>
                        </div>
                    </div>

                    {santris.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {santris.map(santri => (
                                <div
                                    key={santri.id}
                                    className={`p-5 sm:p-6 rounded-2xl border transition-all duration-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                                        santri.has_setor_today
                                            ? 'bg-card border-emerald-300 dark:border-emerald-800/80 shadow-emerald-500/5'
                                            : 'bg-card border-border hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                                >
                                    {/* Left: Santri Identity & Formal/Madin Class */}
                                    <div className="flex items-start gap-4 min-w-0 md:w-1/3">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white flex-shrink-0 shadow-md ${
                                            santri.has_setor_today
                                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 ring-2 ring-emerald-500/30'
                                                : 'bg-gradient-to-br from-slate-400 to-slate-600'
                                        }`}>
                                            {santri.name.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="min-w-0 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-extrabold text-base text-foreground truncate">
                                                    {santri.name}
                                                </h4>
                                                {santri.has_setor_today ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                                                        <Check className="w-3 h-3" />
                                                        Sudah Setor
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                                                        <Clock className="w-3 h-3" />
                                                        Belum Setor
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                                {santri.rombel && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                                        <School className="w-3 h-3 text-blue-500" />
                                                        {santri.rombel.name}
                                                    </span>
                                                )}
                                                {santri.madin_kelas && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
                                                        <GraduationCap className="w-3 h-3" />
                                                        {santri.madin_kelas.nama_kelas}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: Progress Info (Today's or Last Setoran) */}
                                    <div className="md:w-1/3 space-y-1.5 border-t md:border-t-0 md:border-l md:border-r border-border md:px-5 pt-3 md:pt-0">
                                        {santri.has_setor_today ? (
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                                                    Hasil Setoran Hari Ini:
                                                </span>
                                                {santri.today_setorans.map(ts => (
                                                    <div key={ts.id} className="text-xs bg-emerald-50/60 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40 space-y-0.5">
                                                        <div className="flex items-center justify-between font-bold text-foreground">
                                                            <span>{ts.kitab_surat}</span>
                                                            <span className="text-emerald-700 dark:text-emerald-300 font-black">Nilai: {ts.nilai ?? '-'}</span>
                                                        </div>
                                                        <p className="text-muted-foreground text-[11px]">
                                                            {ts.halaman_ayat ?? 'Satu sesi'} • Status: <span className="font-semibold capitalize text-foreground">{ts.status.replace('_', ' ')}</span>
                                                        </p>
                                                        {ts.catatan && (
                                                            <p className="text-[11px] italic text-muted-foreground line-clamp-1">"{ts.catatan}"</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : santri.last_setoran ? (
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                                    Progres Terakhir Sebelumnya:
                                                </span>
                                                <div className="text-xs bg-muted/50 p-2.5 rounded-xl space-y-0.5">
                                                    <div className="flex items-center justify-between font-bold text-foreground">
                                                        <span>{santri.last_setoran.kitab_surat}</span>
                                                        <span className="text-xs font-bold text-muted-foreground">Nilai: {santri.last_setoran.nilai ?? '-'}</span>
                                                    </div>
                                                    <p className="text-muted-foreground text-[11px]">
                                                        {santri.last_setoran.halaman_ayat ?? '-'} • {new Date(santri.last_setoran.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-muted-foreground italic p-2.5">
                                                Belum pernah tercatat setoran sebelumnya
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Action Button */}
                                    <div className="flex items-center justify-end md:w-1/4">
                                        <button
                                            onClick={() => openSetoranModalForSantri(santri)}
                                            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow transition-all ${
                                                santri.has_setor_today
                                                    ? 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:scale-105'
                                            }`}
                                        >
                                            <Plus className="w-4 h-4" />
                                            {santri.has_setor_today ? 'Catat Tambahan' : 'Catat Setoran'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center border border-dashed border-border rounded-3xl bg-card">
                            <Users className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                            <h3 className="font-bold text-lg text-foreground">Kamar Ini Belum Memiliki Santri</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1">
                                Belum ada santri yang diplotkan ke kamar ini. Anda dapat memplotkan santri melalui menu Kamar Pondok.
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Setoran Input Modal for Active Santri ── */}
                {activeSantri && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
                        <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
                            <div className="flex items-center justify-between border-b border-border pb-4">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-emerald-600 uppercase">Input Setoran Santri</span>
                                    <h3 className="font-extrabold text-xl text-foreground">{activeSantri.name}</h3>
                                    <p className="text-xs text-muted-foreground">Kamar: {selectedKamar?.nama_kamar}</p>
                                </div>
                                <button
                                    onClick={() => setActiveSantri(null)}
                                    className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitSetoran} className="space-y-4">

                                {/* Kategori */}
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1.5">
                                        Kategori Setoran <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { key: 'tahfidz_quran', label: "Tahfidz Al-Qur'an" },
                                            { key: 'tahfidz_hadits', label: 'Hadits Tematik' },
                                            { key: 'kitab', label: 'Kitab Kuning' },
                                            { key: 'amalan', label: 'Doa & Amalan' },
                                        ].map(k => (
                                            <button
                                                key={k.key}
                                                type="button"
                                                onClick={() => setData('kategori', k.key as any)}
                                                className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left ${
                                                    data.kategori === k.key
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                        : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                                                }`}
                                            >
                                                {k.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Surat / Kitab */}
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        Surat / Nama Kitab <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Surat An-Naba' / Kitab Safinatun Naja / Hadits Arbain"
                                        value={data.kitab_surat}
                                        onChange={e => setData('kitab_surat', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                                    />
                                    {errors.kitab_surat && <p className="text-xs text-rose-500 mt-1">{errors.kitab_surat}</p>}
                                </div>

                                {/* Rincian Halaman / Ayat */}
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        Rincian Halaman / Ayat
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Ayat 1 - 40 / Halaman 12-14 / Bab Thaharah"
                                        value={data.halaman_ayat}
                                        onChange={e => setData('halaman_ayat', e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                {/* Status Kelancaran (4 Interactive Quick Buttons) */}
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1.5">
                                        Status Kelancaran <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleQuickStatusClick('lancar', 95)}
                                            className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 ${
                                                data.status === 'lancar'
                                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-950/80 dark:text-emerald-200'
                                                    : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                                            }`}
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            Lancar / Mutqin (95)
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleQuickStatusClick('kurang_lancar', 80)}
                                            className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 ${
                                                data.status === 'kurang_lancar'
                                                    ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950/80 dark:text-amber-200'
                                                    : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                                            }`}
                                        >
                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                            Cukup Lancar (80)
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleQuickStatusClick('mengulang', 65)}
                                            className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 ${
                                                data.status === 'mengulang'
                                                    ? 'bg-rose-100 text-rose-900 border-rose-400 dark:bg-rose-950/80 dark:text-rose-200'
                                                    : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                                            }`}
                                        >
                                            <RotateCcw className="w-4 h-4 text-rose-600" />
                                            Perlu Muroja'ah (65)
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleQuickStatusClick('absen', 0)}
                                            className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 ${
                                                data.status === 'absen'
                                                    ? 'bg-slate-200 text-slate-900 border-slate-400 dark:bg-slate-800 dark:text-slate-200'
                                                    : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                                            }`}
                                        >
                                            <Clock className="w-4 h-4 text-slate-600" />
                                            Izin / Sakit (0)
                                        </button>
                                    </div>
                                </div>

                                {/* Nilai Angka */}
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        Nilai Angka (0 - 100)
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

                                {/* Catatan Evaluasi */}
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        Catatan / Nasehat Ustadz
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Catatan makharijul huruf, tajwid mad, kelancaran, dsb..."
                                        value={data.catatan}
                                        onChange={e => setData('catatan', e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                                    <button
                                        type="button"
                                        onClick={() => setActiveSantri(null)}
                                        className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow transition-colors"
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan Setoran'}
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
