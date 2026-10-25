import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    BookOpen,
    GraduationCap,
    Users,
    Calendar,
    Clock,
    User,
    ExternalLink,
    Sparkles,
    FileText,
    School,
    Home,
    AlertCircle,
    CheckCircle2,
    Library,
    Layers,
    Plus,
    Pencil,
    Trash2,
    X,
} from 'lucide-react';

interface GuruUser {
    id: number;
    name: string;
}

interface ClassroomLink {
    id: number;
    mapel: string;
    link: string | null;
    link_uts: string | null;
    uts_mulai: string | null;
    uts_tutup: string | null;
    link_uas: string | null;
    uas_mulai: string | null;
    uas_tutup: string | null;
    keterangan: string | null;
    hari_belajar: string | null;
    jam_mulai: string | null;
    jam_selesai: string | null;
    guru: GuruUser;
    madin_kelas_id: number;
    madin_kelas?: { id: number; nama_kelas: string; tingkat: string };
}

interface SantriUser {
    id: number;
    name: string;
    email: string;
    rombel?: { id: number; name: string } | null;
    kamar?: { id: number; nama_kamar: string } | null;
}

interface MadinKelasData {
    id: number;
    nama_kelas: string;
    tingkat: 'Ula' | 'Wustho' | 'Ulya';
    deskripsi: string | null;
    wali_kelas: { id: number; name: string; email: string } | null;
    santri: SantriUser[];
}

interface Props {
    madinKelasList: MadinKelasData[];
    links: ClassroomLink[];
    kurikulumStandar: Record<string, Array<{ mapel: string; kitab: string; penulis: string }>>;
}

const TINGKAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Ula: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
    Wustho: { bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
    Ulya: { bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
};

const formatUrl = (url: string | null) => {
    if (!url) return '#';
    if (!url.match(/^https?:\/\//i)) {
        return `https://${url}`;
    }
    return url;
};

export default function GuruMadinIndex({
    madinKelasList,
    links,
    kurikulumStandar,
}: Props) {
    const [activeTab, setActiveTab] = useState<'links' | 'kelas' | 'kurikulum'>('links');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<ClassroomLink | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        madin_kelas_id: '',
        mapel: '',
        link: '',
        link_uts: '',
        uts_mulai: '',
        uts_tutup: '',
        link_uas: '',
        uas_mulai: '',
        uas_tutup: '',
        hari_belajar: 'Senin',
        jam_mulai: '15:30',
        jam_selesai: '17:00',
        keterangan: '',
    });

    const openCreateModal = () => {
        setEditingLink(null);
        reset();
        if (madinKelasList.length > 0) {
            setData('madin_kelas_id', String(madinKelasList[0].id));
        }
        setIsModalOpen(true);
    };

    const openEditModal = (link: ClassroomLink) => {
        setEditingLink(link);
        setData({
            madin_kelas_id: String(link.madin_kelas_id),
            mapel: link.mapel,
            link: link.link ?? '',
            link_uts: link.link_uts ?? '',
            uts_mulai: link.uts_mulai ? link.uts_mulai.substring(0, 16) : '',
            uts_tutup: link.uts_tutup ? link.uts_tutup.substring(0, 16) : '',
            link_uas: link.link_uas ?? '',
            uas_mulai: link.uas_mulai ? link.uas_mulai.substring(0, 16) : '',
            uas_tutup: link.uas_tutup ? link.uas_tutup.substring(0, 16) : '',
            hari_belajar: link.hari_belajar ?? 'Senin',
            jam_mulai: link.jam_mulai ?? '15:30',
            jam_selesai: link.jam_selesai ?? '17:00',
            keterangan: link.keterangan ?? '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingLink) {
            put(route('guru.madin.links.update', editingLink.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            post(route('guru.madin.links.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (!confirm('Hapus tautan materi Madin ini?')) return;
        router.delete(route('guru.madin.links.destroy', id), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Madrasah Diniyah', href: '/guru/madin' }]}>
            <Head title="Madrasah Diniyah - Panel Asatidz" />

            <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto space-y-8">

                {/* ── Hero Banner ── */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 text-white shadow-xl">
                    <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                    <div className="absolute top-0 right-1/4 w-40 h-40 rounded-full bg-purple-400/10 blur-xl pointer-events-none" />

                    <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/30 backdrop-blur-md border border-purple-400/30 text-xs font-semibold uppercase tracking-wider text-purple-100">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                Panel Pengajar Diniyah & Kitab Kuning
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                Madrasah Diniyah (Madin)
                            </h1>
                            <p className="text-purple-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
                                Kelola tautan Google Classroom materi kitab (Fiqih, Nahwu, Shorof, Akhlaq), jadwal sore hari, dan pantau santri berdasarkan tingkatan pemahaman agama.
                            </p>
                        </div>

                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-purple-900 font-extrabold text-sm shadow-xl hover:bg-purple-50 hover:scale-105 transition-all flex-shrink-0"
                        >
                            <Plus className="w-4 h-4 text-purple-700" />
                            + Tambah Tautan Madin
                        </button>
                    </div>
                </div>

                {/* ── Navigation Tabs ── */}
                <div className="flex border-b border-border gap-2 sm:gap-6">
                    <button
                        onClick={() => setActiveTab('links')}
                        className={`pb-3.5 px-2 text-sm sm:text-base font-semibold flex items-center gap-2 border-b-2 transition-all ${
                            activeTab === 'links'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        Tautan Google Classroom Diniyah
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                            {links.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('kelas')}
                        className={`pb-3.5 px-2 text-sm sm:text-base font-semibold flex items-center gap-2 border-b-2 transition-all ${
                            activeTab === 'kelas'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Kelas & Santri Madin
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                            {madinKelasList.length} kelas
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('kurikulum')}
                        className={`pb-3.5 px-2 text-sm sm:text-base font-semibold flex items-center gap-2 border-b-2 transition-all ${
                            activeTab === 'kurikulum'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Library className="w-4 h-4" />
                        Panduan Kurikulum Kitab
                    </button>
                </div>

                {/* ── TAB 1: TAUTAN CLASSROOM MADIN ── */}
                {activeTab === 'links' && (
                    <div className="space-y-6">
                        {links.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {links.map(link => (
                                    <div
                                        key={link.id}
                                        className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                                    {link.madin_kelas ? link.madin_kelas.nama_kelas : 'Kelas Madin'}
                                                </span>
                                                {link.hari_belajar && (
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {link.hari_belajar}
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                <h3 className="font-extrabold text-lg text-foreground leading-tight">
                                                    {link.mapel}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5" />
                                                    Pengampu: {link.guru?.name ?? 'Guru Madin'}
                                                </p>
                                            </div>

                                            {link.keterangan && (
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {link.keterangan}
                                                </p>
                                            )}

                                            {link.jam_mulai && (
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/60 p-2 rounded-xl">
                                                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                                                    Pukul {link.jam_mulai} - {link.jam_selesai ?? 'Selesai'} WIB
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-border flex items-center justify-between gap-2">
                                            {link.link && (
                                                <a
                                                    href={formatUrl(link.link)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    Buka
                                                </a>
                                            )}

                                            <div className="flex items-center gap-1 ml-auto">
                                                <button
                                                    onClick={() => openEditModal(link)}
                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                    title="Edit Tautan"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(link.id)}
                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                                    title="Hapus Tautan"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 px-4 border border-dashed border-border rounded-2xl bg-card">
                                <BookOpen className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                                <h3 className="font-bold text-base text-foreground">Belum Ada Tautan Kelas Diniyah</h3>
                                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                    Klik tombol "+ Tambah Tautan Madin" di atas untuk menambahkan link Google Classroom kitab.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB 2: DAFTAR KELAS & SANTRI MADIN ── */}
                {activeTab === 'kelas' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {madinKelasList.map(kelas => (
                            <div
                                key={kelas.id}
                                className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${TINGKAT_COLORS[kelas.tingkat]?.bg} ${TINGKAT_COLORS[kelas.tingkat]?.text} ${TINGKAT_COLORS[kelas.tingkat]?.border}`}>
                                            Tingkat {kelas.tingkat}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-semibold">
                                            {kelas.santri.length} Santri
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-extrabold text-lg text-foreground">{kelas.nama_kelas}</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {kelas.deskripsi ?? 'Pendidikan Kitab Diniyah Berjenjang'}
                                        </p>
                                    </div>

                                    <div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-xs">
                                        <span className="text-muted-foreground">Wali Kelas Diniyah: </span>
                                        <span className="font-bold text-foreground">
                                            {kelas.wali_kelas?.name ?? 'Belum Ditugaskan'}
                                        </span>
                                    </div>

                                    {/* Santri List */}
                                    <div className="space-y-1.5 pt-2 border-t border-border">
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase">Santri Terdaftar:</p>
                                        {kelas.santri.length > 0 ? (
                                            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                                                {kelas.santri.map(s => (
                                                    <div key={s.id} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-muted/40">
                                                        <span className="font-bold text-foreground truncate">{s.name}</span>
                                                        <div className="flex items-center gap-1">
                                                            {s.rombel && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{s.rombel.name}</span>}
                                                            {s.kamar && <span className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">{s.kamar.nama_kamar}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic">Belum ada santri diplotkan</p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setEditingLink(null);
                                        reset();
                                        setData('madin_kelas_id', String(kelas.id));
                                        setIsModalOpen(true);
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Tambah Pelajaran Kelas Ini
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── TAB 3: PANDUAN KURIKULUM STANDAR ── */}
                {activeTab === 'kurikulum' && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Standar Kurikulum Kitab Diniyah</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Pembagian kurikulum kitab rujukan pesantren berdasarkan jenjang tingkat santri (Ula, Wustho, Ulya).
                            </p>
                        </div>

                        {Object.entries(kurikulumStandar).map(([tingkat, kits]) => (
                            <div key={tingkat} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-border pb-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${TINGKAT_COLORS[tingkat]?.bg} ${TINGKAT_COLORS[tingkat]?.text} ${TINGKAT_COLORS[tingkat]?.border}`}>
                                            Tingkat {tingkat}
                                        </span>
                                        <h4 className="font-bold text-base text-foreground">
                                            {tingkat === 'Ula' ? 'Jenjang Dasar (Ibtida\'i)' : tingkat === 'Wustho' ? 'Jenjang Menengah (Mutawassith)' : 'Jenjang Lanjutan (Aliy)'}
                                        </h4>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{kits.length} Mata Pelajaran</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {kits.map((kit, idx) => (
                                        <div key={idx} className="p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-1">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 block">
                                                {kit.mapel}
                                            </span>
                                            <h5 className="font-bold text-sm text-foreground">{kit.kitab}</h5>
                                            <p className="text-xs text-muted-foreground">Karya: {kit.penulis}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Modal Input / Edit Tautan Madin ── */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
                            <div className="flex items-center justify-between border-b border-border pb-4">
                                <div>
                                    <h3 className="font-extrabold text-xl text-foreground">
                                        {editingLink ? 'Edit Tautan Pelajaran Madin' : 'Tambah Tautan Pelajaran Madin'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Kelola Google Classroom dan jadwal pelajaran Diniyah santri.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        Kelas Madin Sasaran <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.madin_kelas_id}
                                        onChange={e => setData('madin_kelas_id', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">-- Pilih Kelas Madin --</option>
                                        {madinKelasList.map(k => (
                                            <option key={k.id} value={k.id}>
                                                {k.nama_kelas} (Tingkat {k.tingkat})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.madin_kelas_id && <p className="text-xs text-rose-500 mt-1">{errors.madin_kelas_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        Nama Mata Pelajaran / Kitab <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Fiqih (Safinatun Naja) / Nahwu (Al-Jurumiyyah)"
                                        value={data.mapel}
                                        onChange={e => setData('mapel', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-purple-500"
                                    />
                                    {errors.mapel && <p className="text-xs text-rose-500 mt-1">{errors.mapel}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        Tautan Google Classroom
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://classroom.google.com/c/..."
                                        value={data.link}
                                        onChange={e => setData('link', e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-purple-500"
                                    />
                                    {errors.link && <p className="text-xs text-rose-500 mt-1">{errors.link}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-foreground mb-1">
                                            Hari Belajar
                                        </label>
                                        <select
                                            value={data.hari_belajar}
                                            onChange={e => setData('hari_belajar', e.target.value)}
                                            className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-purple-500"
                                        >
                                            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-foreground mb-1">
                                            Jam Mulai
                                        </label>
                                        <input
                                            type="time"
                                            value={data.jam_mulai}
                                            onChange={e => setData('jam_mulai', e.target.value)}
                                            className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-foreground mb-1">
                                            Jam Selesai
                                        </label>
                                        <input
                                            type="time"
                                            value={data.jam_selesai}
                                            onChange={e => setData('jam_selesai', e.target.value)}
                                            className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1">
                                        Keterangan / Deskripsi Pelajaran
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Kajian bab thaharah, hafalan nadhom, dsb..."
                                        value={data.keterangan}
                                        onChange={e => setData('keterangan', e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow transition-colors"
                                    >
                                        {processing ? 'Menyimpan...' : editingLink ? 'Simpan Perubahan' : 'Tambah Tautan'}
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
