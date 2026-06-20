import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BookOpen, ExternalLink, User, GraduationCap, AlertTriangle } from 'lucide-react';

interface Guru {
    id: number;
    name: string;
}

interface ClassroomLink {
    id: number;
    mapel: string;
    link: string;
    keterangan: string | null;
    guru: Guru;
    created_at: string;
}

interface IndexProps {
    links: ClassroomLink[];
    rombel: string | null;
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

export default function Index({ links, rombel }: IndexProps) {
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
                                            <div className="bg-muted/60 rounded-xl px-4 py-3 mb-5 border border-border/60 text-sm flex-1">
                                                <p className="text-muted-foreground whitespace-pre-wrap line-clamp-4 leading-relaxed">
                                                    {link.keterangan}
                                                </p>
                                            </div>
                                        )}

                                        {/* Tombol */}
                                        <a
                                            href={link.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`mt-auto flex items-center justify-center gap-2 w-full py-3 text-white rounded-xl font-semibold shadow-sm transition-all duration-200 group-hover:shadow-md ${BTN_COLOR[idx]}`}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Gabung ke Kelas
                                        </a>
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
