import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Plus, Trash2, ExternalLink, BookOpen, School, X, Loader2, GraduationCap, Link as LinkIcon } from 'lucide-react';

interface Rombel {
    id: number;
    name: string;
}

interface ClassroomLink {
    id: number;
    mapel: string;
    link: string;
    keterangan: string | null;
    rombel: Rombel;
    created_at: string;
}

interface IndexProps {
    links: ClassroomLink[];
    rombels: Rombel[];
}

const ACCENT = [
    { bar: 'bg-blue-500', icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700' },
    { bar: 'bg-violet-500', icon: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600', btn: 'bg-violet-600 hover:bg-violet-700' },
    { bar: 'bg-emerald-500', icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700' },
    { bar: 'bg-orange-500', icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600', btn: 'bg-orange-600 hover:bg-orange-700' },
    { bar: 'bg-pink-500', icon: 'bg-pink-100 dark:bg-pink-900/40 text-pink-600', btn: 'bg-pink-600 hover:bg-pink-700' },
    { bar: 'bg-cyan-500', icon: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600', btn: 'bg-cyan-600 hover:bg-cyan-700' },
];

const inputCls = 'w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition text-sm';

export default function Index({ links, rombels }: IndexProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, post, delete: destroy, errors, reset, processing } = useForm({
        rombel_id: '',
        mapel: '',
        link: '',
        keterangan: '',
    });

    const handleOpenModal = () => { reset(); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); reset(); };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('guru.classroom-links.store'), { onSuccess: () => handleCloseModal() });
    };
    const handleDelete = (id: number) => {
        if (confirm('Hapus tautan kelas ini?')) destroy(route('guru.classroom-links.destroy', id));
    };

    // Group by rombel
    const grouped = links.reduce<Record<string, { rombel: Rombel; items: ClassroomLink[] }>>((acc, link) => {
        const key = String(link.rombel?.id);
        if (!acc[key]) acc[key] = { rombel: link.rombel, items: [] };
        acc[key].items.push(link);
        return acc;
    }, {});

    return (
        <AppLayout breadcrumbs={[{ title: 'Tautan Kelas', href: '/guru/classroom-links' }]}>
            <Head title="Tautan Google Classroom" />

            <div className="p-6 lg:p-10 w-full">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-300/40">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Tautan Google Classroom</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">{links.length} tautan aktif · {Object.keys(grouped).length} kelas</p>
                        </div>
                    </div>
                    <button
                        onClick={handleOpenModal}
                        className="self-start sm:self-auto inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 active:scale-95 transition-all font-semibold shadow-lg shadow-blue-300/40 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Tautan Baru
                    </button>
                </div>

                {/* ── Empty State ── */}
                {links.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-border rounded-2xl text-center">
                        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center mb-6">
                            <School className="w-12 h-12 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Belum ada tautan kelas</h3>
                        <p className="text-muted-foreground max-w-sm mb-6 text-sm leading-relaxed">
                            Bagikan tautan Google Classroom ke siswa agar mereka bisa bergabung ke kelas digital Anda.
                        </p>
                        <button onClick={handleOpenModal} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold text-sm">
                            <Plus className="w-4 h-4" /> Tambah Tautan Sekarang
                        </button>
                    </div>
                )}

                {/* ── Grouped sections ── */}
                <div className="space-y-10">
                    {Object.values(grouped).map(({ rombel, items }) => (
                        <div key={rombel.id}>
                            {/* Section header */}
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h2 className="text-lg font-bold text-foreground">Kelas {rombel.name}</h2>
                                <span className="ml-1 text-xs bg-muted text-muted-foreground rounded-full px-2.5 py-1 font-medium">{items.length} mata pelajaran</span>
                            </div>

                            {/* Horizontal card list */}
                            <div className="space-y-3">
                                {items.map((link, i) => {
                                    const ac = ACCENT[i % ACCENT.length];
                                    return (
                                        <div
                                            key={link.id}
                                            className="group w-full flex flex-col sm:flex-row sm:items-center gap-4 bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300 p-0"
                                        >
                                            {/* Left accent bar */}
                                            <div className={`hidden sm:block w-1.5 self-stretch flex-shrink-0 ${ac.bar} rounded-l-2xl`} />
                                            {/* Mobile top bar */}
                                            <div className={`sm:hidden h-1.5 w-full ${ac.bar}`} />

                                            <div className="flex items-center gap-4 flex-1 px-5 py-4 sm:pl-3 min-w-0">
                                                {/* Icon */}
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${ac.icon}`}>
                                                    <BookOpen className="w-6 h-6" />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-foreground text-base truncate">{link.mapel}</h3>
                                                    {link.keterangan && (
                                                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{link.keterangan}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-3 px-5 pb-4 sm:pb-0 sm:pr-5 flex-shrink-0">
                                                <a
                                                    href={link.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 whitespace-nowrap ${ac.btn}`}
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    Buka Classroom
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(link.id)}
                                                    className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex-shrink-0"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                                    <LinkIcon className="w-4 h-4 text-blue-600" />
                                </div>
                                <h2 className="text-base font-bold text-foreground">Buat Tautan Kelas Baru</h2>
                            </div>
                            <button onClick={handleCloseModal} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Kelas Tujuan</label>
                                <select value={data.rombel_id} onChange={e => setData('rombel_id', e.target.value)} className={inputCls} required>
                                    <option value="">-- Pilih Kelas --</option>
                                    {rombels.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                                {errors.rombel_id && <p className="text-red-500 text-xs mt-1">{errors.rombel_id}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Nama Mata Pelajaran</label>
                                <input type="text" value={data.mapel} onChange={e => setData('mapel', e.target.value)} className={inputCls} placeholder="Contoh: Matematika Peminatan" required />
                                {errors.mapel && <p className="text-red-500 text-xs mt-1">{errors.mapel}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Tautan Undangan (Invite Link)</label>
                                <input type="url" value={data.link} onChange={e => setData('link', e.target.value)} className={inputCls} placeholder="https://classroom.google.com/c/..." required />
                                {errors.link && <p className="text-red-500 text-xs mt-1">{errors.link}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Keterangan <span className="text-muted-foreground font-normal">(Opsional)</span>
                                </label>
                                <textarea value={data.keterangan} onChange={e => setData('keterangan', e.target.value)} className={`${inputCls} min-h-[90px] resize-none`} placeholder="Contoh: Kode kelas: abcxyz12" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 border border-border rounded-xl hover:bg-muted text-sm font-medium transition-colors">
                                    Batal
                                </button>
                                <button type="submit" disabled={processing} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold transition-colors">
                                    {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Bagikan Tautan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
