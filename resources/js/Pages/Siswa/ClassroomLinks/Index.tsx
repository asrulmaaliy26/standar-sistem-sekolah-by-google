import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BookOpen, ExternalLink, User, GraduationCap, AlertTriangle, FileText, ClipboardList, CalendarDays, CheckCircle2 } from 'lucide-react';

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
    guru: Guru;
    created_at: string;
}

interface ExamSessionStatus {
    classroom_link_id: number;
    exam_type: 'uts' | 'uas';
    status: 'active' | 'blocked' | 'finished';
}

interface IndexProps {
    links: ClassroomLink[];
    rombel: string | null;
    examSessions: ExamSessionStatus[];
}

// Warna gradient per-kartu (siklus)
const GRADIENTS = [
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-rose-500',
    'from-cyan-500 to-blue-600',
    'from-pink-500 to-rose-600',
];

const ICON_BG = [
    'bg-blue-100 text-blue-600',
    'bg-violet-100 text-violet-600',
    'bg-emerald-100 text-emerald-600',
    'bg-orange-100 text-orange-600',
    'bg-cyan-100 text-cyan-600',
    'bg-pink-100 text-pink-600',
];

const BTN_COLOR = [
    'bg-blue-600 hover:bg-blue-700',
    'bg-violet-600 hover:bg-violet-700',
    'bg-emerald-600 hover:bg-emerald-700',
    'bg-orange-600 hover:bg-orange-700',
    'bg-cyan-600 hover:bg-cyan-700',
    'bg-pink-600 hover:bg-pink-700',
];

const formatUrl = (url: string | null) => {
    if (!url) return '#';
    if (!url.match(/^https?:\/\//i)) {
        return `https://${url}`;
    }
    return url;
};

export default function Index({ links, rombel, examSessions = [] }: IndexProps) {
    return (
        <AppLayout breadcrumbs={[
            { title: 'Daftar Kelas', href: '/siswa/classroom-links' },
        ]}>
            <Head title="Daftar Kelas Google Classroom" />

            <div className="p-6 lg:p-8 max-w-screen-2xl mx-auto">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                                Google Classroom
                            </h1>
                        </div>
                        <p className="text-muted-foreground mt-2 ml-[52px]">
                            {rombel
                                ? <>Tautan kelas untuk <span className="font-semibold text-foreground">{rombel}</span></>
                                : 'Pilih kelas terlebih dahulu untuk melihat tautan.'}
                        </p>
                    </div>

                    {rombel && (
                        <span className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold">
                            <BookOpen className="w-4 h-4" />
                            {rombel}
                        </span>
                    )}
                </div>

                {/* ── Belum memilih kelas ── */}
                {!rombel ? (
                    <div className="flex flex-col items-center justify-center text-center py-20 bg-amber-50 dark:bg-amber-950/20 border-2 border-dashed border-amber-300 rounded-2xl">
                        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-5">
                            <AlertTriangle className="w-10 h-10 text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-300 mb-2">Profil Belum Lengkap</h2>
                        <p className="text-amber-700 dark:text-amber-400 max-w-sm">
                            Anda belum memilih kelas. Segarkan halaman untuk memunculkan popup pemilihan kelas.
                        </p>
                    </div>

                ) : links.length === 0 ? (
                    /* ── Kelas kosong ── */
                    <div className="flex flex-col items-center justify-center text-center py-20 bg-card border-2 border-dashed border-border rounded-2xl">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-5">
                            <BookOpen className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-semibold text-foreground mb-2">Belum ada tautan kelas</h3>
                        <p className="text-muted-foreground max-w-sm">
                            Guru belum membagikan tautan Google Classroom untuk kelas <span className="font-medium">{rombel}</span>. Periksa kembali nanti.
                        </p>
                    </div>

                ) : (
                    /* ── Grid kartu ── */
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {links.map((link, i) => {
                            const idx = i % GRADIENTS.length;
                            const utsSession = examSessions.find(s => s.classroom_link_id === link.id && s.exam_type === 'uts');
                            const uasSession = examSessions.find(s => s.classroom_link_id === link.id && s.exam_type === 'uas');
                            const isUtsFinished = utsSession?.status === 'finished';
                            const isUasFinished = uasSession?.status === 'finished';
                            
                            return (
                                <div
                                    key={link.id}
                                    className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    {/* Top gradient bar */}
                                    <div className={`h-2 bg-gradient-to-r ${GRADIENTS[idx]}`} />

                                    <div className="p-6 flex flex-col h-full">
                                        {/* Icon + judul */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${ICON_BG[idx]}`}>
                                                <BookOpen className="w-6 h-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-lg font-bold text-foreground leading-snug line-clamp-2">
                                                    {link.mapel}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="truncate">{link.guru?.name}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Keterangan */}
                                        {link.keterangan && (
                                            <div className="bg-muted/60 rounded-xl px-4 py-3 mb-3 border border-border/60 text-sm mt-auto">
                                                <p className="text-muted-foreground whitespace-pre-wrap line-clamp-4 leading-relaxed">
                                                    {link.keterangan}
                                                </p>
                                            </div>
                                        )}

                                        {/* Tanggal UTS / UAS */}
                                        {(link.uts_mulai || link.uts_tutup || link.uas_mulai || link.uas_tutup) && (
                                            <div className="flex flex-col gap-1.5 mb-3 mt-auto">
                                                {(link.uts_mulai || link.uts_tutup) && (
                                                    <div className="flex items-center gap-1.5 text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-xl px-3 py-2 border border-amber-200 dark:border-amber-900/50">
                                                        <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                                                        <span className="font-semibold">UTS:</span>
                                                        <span>
                                                            {link.uts_mulai ? new Date(link.uts_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '?'}
                                                            {link.uts_tutup ? ` – ${new Date(link.uts_tutup).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                                                        </span>
                                                    </div>
                                                )}
                                                {(link.uas_mulai || link.uas_tutup) && (
                                                    <div className="flex items-center gap-1.5 text-xs bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 rounded-xl px-3 py-2 border border-rose-200 dark:border-rose-900/50">
                                                        <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                                                        <span className="font-semibold">UAS:</span>
                                                        <span>
                                                            {link.uas_mulai ? new Date(link.uas_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '?'}
                                                            {link.uas_tutup ? ` – ${new Date(link.uas_tutup).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Tombol */}
                                        {(!link.link && !link.link_uts && !link.link_uas && !link.uts_mulai && !link.uts_tutup && !link.uas_mulai && !link.uas_tutup && !link.keterangan) ? (
                                            <div className="mt-auto flex flex-col items-center justify-center py-4 bg-muted/30 rounded-xl border border-dashed border-border/50">
                                                <span className="text-xs text-muted-foreground text-center px-4">Belum ada tautan yang ditambahkan oleh guru</span>
                                            </div>
                                        ) : (
                                            <div className={!link.keterangan && !link.uts_mulai && !link.uts_tutup && !link.uas_mulai && !link.uas_tutup ? 'mt-auto' : ''}>
                                                {link.link && (
                                                    <a
                                                        href={formatUrl(link.link)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`flex items-center justify-center gap-2 w-full py-3 text-white rounded-xl font-semibold shadow-sm transition-all duration-200 group-hover:shadow-md ${BTN_COLOR[idx]}`}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        Gabung ke Kelas
                                                    </a>
                                                )}
                                                {(link.link_uts || link.link_uas) && (
                                                    <div className={`flex gap-2 ${link.link ? 'mt-2' : ''}`}>
                                                        {link.link_uts && (
                                                            isUtsFinished ? (
                                                                <button
                                                                    disabled
                                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 text-gray-400 rounded-xl font-semibold text-sm cursor-not-allowed border border-gray-200"
                                                                >
                                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                                    UTS Selesai
                                                                </button>
                                                            ) : (
                                                                <Link
                                                                    href={route('siswa.exam.play', { link: link.id, type: 'uts' })}
                                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-sm shadow-sm transition-all duration-200"
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                    Ujian UTS
                                                                </Link>
                                                            )
                                                        )}
                                                        {link.link_uas && (
                                                            isUasFinished ? (
                                                                <button
                                                                    disabled
                                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 text-gray-400 rounded-xl font-semibold text-sm cursor-not-allowed border border-gray-200"
                                                                >
                                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                                    UAS Selesai
                                                                </button>
                                                            ) : (
                                                                <Link
                                                                    href={route('siswa.exam.play', { link: link.id, type: 'uas' })}
                                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all duration-200"
                                                                >
                                                                    <ClipboardList className="w-4 h-4" />
                                                                    Ujian UAS
                                                                </Link>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
