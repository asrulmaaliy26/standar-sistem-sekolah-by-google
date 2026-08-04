import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Users, School, MapPin, Layers, Mail, ChevronLeft, BookOpen, Clock, ExternalLink, Edit } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

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

interface User {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
}

interface ClassroomLink {
    id: number;
    mapel: string;
    link: string | null;
    link_uts: string | null;
    link_uas: string | null;
    keterangan: string | null;
    guru: string;
    hari_belajar: string | null;
    jam_mulai: string | null;
    jam_selesai: string | null;
}

interface ShowProps {
    rombel: {
        id: number;
        name: string;
        lokasi: string | null;
        jenjang: string;
    };
    users: User[];
    classroomLinks: ClassroomLink[];
}

export default function Show({ rombel, users, classroomLinks }: ShowProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingLinkId, setEditingLinkId] = useState<number | null>(null);

    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        mapel: '',
        rombel_id: rombel.id.toString(),
        link: '',
        link_uts: '',
        link_uas: '',
        keterangan: '',
        hari_belajar: '',
        jam_mulai: '',
        jam_selesai: '',
    });

    const handleEditClick = (linkItem: ClassroomLink) => {
        setEditingLinkId(linkItem.id);
        setData({
            mapel: linkItem.mapel || '',
            rombel_id: rombel.id.toString(),
            link: linkItem.link || '',
            link_uts: linkItem.link_uts || '',
            link_uas: linkItem.link_uas || '',
            keterangan: linkItem.keterangan || '',
            hari_belajar: linkItem.hari_belajar || '',
            jam_mulai: linkItem.jam_mulai || '',
            jam_selesai: linkItem.jam_selesai || '',
        });
        clearErrors();
        setIsEditDialogOpen(true);
    };

    const submitEditForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLinkId) return;
        put(route('admin.guru.update-link', editingLinkId), {
            onSuccess: () => {
                setIsEditDialogOpen(false);
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Data Kelas', href: '/admin/rombels' },
            { title: `Kelas ${rombel.name}`, href: `/admin/rombels/${rombel.id}` },
        ]}>
            <Head title={`Murid Kelas ${rombel.name}`} />
            <div className="p-4 sm:p-6 space-y-8">
                
                {/* ── Header ── */}
                <div className="flex flex-col gap-4">
                    <Link href="/admin/rombels" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors self-start">
                        <ChevronLeft className="w-4 h-4" />
                        Kembali ke Data Kelas
                    </Link>
                    
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 flex-shrink-0 mt-1">
                            <School className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Kelas {rombel.name}</h1>
                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-200">
                                    <Layers className="w-4 h-4" />
                                    {rombel.jenjang}
                                </span>
                                {rombel.lokasi && (
                                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                        <MapPin className="w-4 h-4" />
                                        {rombel.lokasi}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 bg-blue-50 dark:bg-blue-950/30 px-3 py-1 rounded-full border border-blue-200">
                                    <Users className="w-4 h-4" />
                                    {users.length} Murid
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Classroom Links Grid ── */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground mb-4">Tautan Mata Pelajaran</h2>
                    
                    {classroomLinks.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center bg-card border-2 border-dashed border-border rounded-2xl">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <BookOpen className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">Belum ada mata pelajaran</h3>
                            <p className="text-sm text-muted-foreground">Kelas ini belum memiliki tautan mata pelajaran yang dijadwalkan.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                            {classroomLinks.map((linkItem, i) => {
                                const idx = i % GRADIENTS.length;
                                return (
                                    <div
                                        key={linkItem.id}
                                        className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                    >
                                        {/* Top gradient bar */}
                                        <div className={`h-2 bg-gradient-to-r ${GRADIENTS[idx]}`} />

                                        <div className="p-4 sm:p-6 flex flex-col h-full">
                                            {/* Icon + judul */}
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${ICON_BG[idx]}`}>
                                                    <BookOpen className="w-6 h-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-lg font-bold text-foreground leading-snug line-clamp-2">
                                                        {linkItem.mapel}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                                        <Users className="w-3.5 h-3.5 flex-shrink-0" />
                                                        <span className="truncate">{linkItem.guru}</span>
                                                    </div>
                                                    {/* Jadwal belajar */}
                                                    {(linkItem.hari_belajar || linkItem.jam_mulai) && (
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {linkItem.hari_belajar && (
                                                                <span className="inline-flex items-center gap-1 text-xs bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-full px-2.5 py-0.5 font-medium">
                                                                    <Clock className="w-3 h-3" />
                                                                    {linkItem.hari_belajar} {linkItem.jam_mulai ? `(${linkItem.jam_mulai} - ${linkItem.jam_selesai})` : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Tombol */}
                                            <div className="mt-auto pt-4">
                                                {linkItem.link ? (
                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={formatUrl(linkItem.link)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-white rounded-xl font-semibold shadow-sm transition-all duration-200 group-hover:shadow-md ${BTN_COLOR[idx]}`}
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                            Gabung ke Kelas
                                                        </a>
                                                        <button
                                                            onClick={() => handleEditClick(linkItem)}
                                                            className="flex items-center justify-center p-3 text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors"
                                                            title="Edit Tautan"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 flex items-center justify-center py-3 bg-muted/30 rounded-xl border border-dashed border-border/50">
                                                            <span className="text-sm text-muted-foreground">Belum ada tautan</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleEditClick(linkItem)}
                                                            className="flex items-center justify-center p-3 text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors"
                                                            title="Edit Tautan"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Users List ── */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-border bg-muted/20">
                        <h2 className="text-lg font-bold text-foreground">Daftar Murid</h2>
                    </div>

                    {users.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">Belum ada murid</h3>
                            <p className="text-sm text-muted-foreground">Belum ada murid yang terdaftar atau memilih kelas ini.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {users.map((user, index) => (
                                <div key={user.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-muted/30 transition-colors">
                                    <div className="w-8 font-medium text-muted-foreground text-center flex-shrink-0 hidden sm:block">
                                        {index + 1}
                                    </div>
                                    <div className="flex items-center gap-4 flex-1">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.name} className="w-12 h-12 rounded-full border border-border object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-200">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-foreground text-base">{user.name}</h3>
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                                                <Mail className="w-3.5 h-3.5" />
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 self-start sm:self-auto">
                                        <Link href={`/admin/users?search=${encodeURIComponent(user.email)}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted hover:text-foreground transition-colors">
                                            Kelola Akun
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Tautan Mata Pelajaran</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEditForm} className="space-y-4 py-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Mata Pelajaran</label>
                            <input
                                type="text"
                                value={data.mapel}
                                onChange={e => setData('mapel', e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                required
                            />
                            {errors.mapel && <p className="text-red-500 text-xs mt-1">{errors.mapel}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Tautan Utama (Link)</label>
                            <input
                                type="url"
                                value={data.link}
                                onChange={e => setData('link', e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                placeholder="https://..."
                            />
                            {errors.link && <p className="text-red-500 text-xs mt-1">{errors.link}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Link UTS (Opsional)</label>
                                <input
                                    type="url"
                                    value={data.link_uts}
                                    onChange={e => setData('link_uts', e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                />
                                {errors.link_uts && <p className="text-red-500 text-xs mt-1">{errors.link_uts}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Link UAS (Opsional)</label>
                                <input
                                    type="url"
                                    value={data.link_uas}
                                    onChange={e => setData('link_uas', e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                />
                                {errors.link_uas && <p className="text-red-500 text-xs mt-1">{errors.link_uas}</p>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Keterangan (Opsional)</label>
                            <textarea
                                value={data.keterangan}
                                onChange={e => setData('keterangan', e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                rows={2}
                            ></textarea>
                            {errors.keterangan && <p className="text-red-500 text-xs mt-1">{errors.keterangan}</p>}
                        </div>

                        <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Hari Belajar</label>
                                <select
                                    value={data.hari_belajar}
                                    onChange={e => setData('hari_belajar', e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">- Pilih Hari -</option>
                                    <option value="Senin">Senin</option>
                                    <option value="Selasa">Selasa</option>
                                    <option value="Rabu">Rabu</option>
                                    <option value="Kamis">Kamis</option>
                                    <option value="Jumat">Jumat</option>
                                    <option value="Sabtu">Sabtu</option>
                                    <option value="Minggu">Minggu</option>
                                </select>
                                {errors.hari_belajar && <p className="text-red-500 text-xs mt-1">{errors.hari_belajar}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Jam Mulai</label>
                                <input
                                    type="time"
                                    value={data.jam_mulai}
                                    onChange={e => setData('jam_mulai', e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                />
                                {errors.jam_mulai && <p className="text-red-500 text-xs mt-1">{errors.jam_mulai}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Jam Selesai</label>
                                <input
                                    type="time"
                                    value={data.jam_selesai}
                                    onChange={e => setData('jam_selesai', e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                />
                                {errors.jam_selesai && <p className="text-red-500 text-xs mt-1">{errors.jam_selesai}</p>}
                            </div>
                        </div>

                        <DialogFooter>
                            <button
                                type="button"
                                onClick={() => setIsEditDialogOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
