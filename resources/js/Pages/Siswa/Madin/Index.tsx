import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
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
    BookMarked,
} from 'lucide-react';

interface Guru {
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
    guru: Guru;
}

interface TemanSekelas {
    id: number;
    name: string;
    email: string;
    jenis_kelamin: string | null;
    rombel: { id: number; name: string } | null;
    kamar: { id: number; nama_kamar: string } | null;
}

interface MadinKelasData {
    id: number;
    nama_kelas: string;
    tingkat: 'Ula' | 'Wustho' | 'Ulya';
    deskripsi: string | null;
    wali_kelas: { id: number; name: string; email: string } | null;
}

interface Props {
    madinKelas: MadinKelasData | null;
    temanSekelas: TemanSekelas[];
    links: ClassroomLink[];
    examSessions: Array<{
        classroom_link_id: number;
        exam_type: 'uts' | 'uas';
        status: 'active' | 'blocked' | 'finished';
    }>;
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

export default function SiswaMadinIndex({
    madinKelas,
    temanSekelas,
    links,
    examSessions = [],
    kurikulumStandar,
}: Props) {
    const [activeTab, setActiveTab] = useState<'classroom' | 'kurikulum' | 'teman'>('classroom');

    const tingkatColor = madinKelas?.tingkat ? (TINGKAT_COLORS[madinKelas.tingkat] ?? TINGKAT_COLORS.Ula) : TINGKAT_COLORS.Ula;

    return (
        <AppLayout breadcrumbs={[{ title: 'Madrasah Diniyah', href: '/siswa/madin' }]}>
            <Head title="Madrasah Diniyah (Madin) Santri" />

            <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto space-y-8">

                {/* ── Hero Banner ── */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 text-white shadow-xl">
                    <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                    <div className="absolute top-0 right-1/4 w-40 h-40 rounded-full bg-purple-400/10 blur-xl pointer-events-none" />

                    <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/30 backdrop-blur-md border border-purple-400/30 text-xs font-semibold uppercase tracking-wider text-purple-100">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                Pendidikan Keagamaan Pesantren Al-Hidayah
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                Madrasah Diniyah (Madin)
                            </h1>
                            <p className="text-purple-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
                                Pendalaman ilmu agama Islam berjenjang (Ula, Wustho, Ulya) meliputi Fiqih, Nahwu, Shorof, Akhlaq, Hadits, dan Bahasa Arab.
                            </p>
                        </div>

                        {/* Class Badge */}
                        <div className="flex-shrink-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex items-center gap-4 text-white">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xs uppercase tracking-wider text-purple-200 font-semibold block">Kelas Diniyah Anda</span>
                                <h3 className="font-bold text-lg leading-tight">
                                    {madinKelas ? madinKelas.nama_kelas : 'Belum Ditentukan'}
                                </h3>
                                <p className="text-xs text-purple-100/80 mt-0.5">
                                    {madinKelas ? `Tingkat ${madinKelas.tingkat} • Sore Hari` : 'Hubungi Wali Kelas Madin'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Quick Info Bar ── */}
                {madinKelas && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center flex-shrink-0">
                                <Layers className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Jenjang Tingkat</p>
                                <h4 className="font-bold text-foreground text-sm sm:text-base mt-0.5">
                                    Tingkat {madinKelas.tingkat}
                                </h4>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Wali Kelas Diniyah</p>
                                <h4 className="font-bold text-foreground text-sm sm:text-base mt-0.5">
                                    {madinKelas.wali_kelas ? madinKelas.wali_kelas.name : 'Belum Ditugaskan'}
                                </h4>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Teman Sekelas</p>
                                <h4 className="font-bold text-foreground text-sm sm:text-base mt-0.5">
                                    {temanSekelas.length + 1} Santri
                                </h4>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Navigation Tabs ── */}
                <div className="flex border-b border-border gap-2 sm:gap-6">
                    <button
                        onClick={() => setActiveTab('classroom')}
                        className={`pb-3.5 px-2 text-sm sm:text-base font-semibold flex items-center gap-2 border-b-2 transition-all ${
                            activeTab === 'classroom'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        Pelajaran & Google Classroom
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                            {links.length}
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
                        Kurikulum & Kitab Diniyah
                    </button>

                    <button
                        onClick={() => setActiveTab('teman')}
                        className={`pb-3.5 px-2 text-sm sm:text-base font-semibold flex items-center gap-2 border-b-2 transition-all ${
                            activeTab === 'teman'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Teman Sekelas Madin
                        {temanSekelas.length > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                                {temanSekelas.length} teman
                            </span>
                        )}
                    </button>
                </div>

                {/* ── TAB 1: CLASSROOM LINKS DINIYAH ── */}
                {activeTab === 'classroom' && (
                    <div className="space-y-6">
                        {links.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {links.map(link => (
                                    <div
                                        key={link.id}
                                        className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                                    Madrasah Diniyah
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
                                                    {link.guru?.name ?? 'Guru Madin'}
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

                                        <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-3">
                                            {link.link ? (
                                                <a
                                                    href={formatUrl(link.link)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow transition-colors flex-1 justify-center"
                                                >
                                                    <BookOpen className="w-3.5 h-3.5" />
                                                    Buka Classroom
                                                    <ExternalLink className="w-3 h-3 ml-0.5" />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic flex-1 text-center py-2">
                                                    Tautan belum tersedia
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 px-4 border border-dashed border-border rounded-2xl bg-card">
                                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mx-auto mb-3">
                                    <BookOpen className="w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Belum Ada Tautan Kelas Diniyah</h3>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                                    Tautan Google Classroom untuk mata pelajaran diniyah Anda akan muncul di sini setelah ditambahkan oleh Ustadz pengampu.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB 2: KURIKULUM & KITAB STANDAR ── */}
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

                {/* ── TAB 3: TEMAN SEKELAS MADIN ── */}
                {activeTab === 'teman' && (
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/60 text-xs sm:text-sm text-purple-900 dark:text-purple-200">
                            💡 <span className="font-bold">Keunikan Kelas Madin: </span>
                            Santri di kelas ini dikelompokkan berdasarkan kemampuan pemahaman ilmu agama, sehingga bisa terdiri dari santri yang berasal dari berbagai kelas formal yang berbeda.
                        </div>

                        {temanSekelas.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {temanSekelas.map(teman => (
                                    <div
                                        key={teman.id}
                                        className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
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
                                                {teman.kamar && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                                                        <Home className="w-3 h-3" />
                                                        {teman.kamar.nama_kamar}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 border border-dashed border-border rounded-2xl text-center text-muted-foreground text-sm bg-card">
                                Belum ada santri lain yang terdaftar di kelas Madin ini selain Anda.
                            </div>
                        )}
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
