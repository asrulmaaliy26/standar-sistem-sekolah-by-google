import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import {
    BookOpen,
    Building2,
    CalendarDays,
    ClipboardList,
    Clock,
    ExternalLink,
    FileText,
    GraduationCap,
    Link as LinkIcon,
    Loader2,
    Pencil,
    Plus,
    School,
    Trash2,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface Jenjang {
    id: number;
    nama: string;
}
interface Rombel {
    id: number;
    name: string;
    jenjang_id: number;
    jenjang?: Jenjang;
}
interface ClassroomLink {
    id: number;
    mapel: string;
    link: string | null;
    link_uts: string | null;
    uts_mulai: string | null;
    uts_tutup: string | null;
    uts_durasi: number | null;
    link_uas: string | null;
    uas_mulai: string | null;
    uas_tutup: string | null;
    uas_durasi: number | null;
    keterangan: string | null;
    hari_belajar: string | null;
    jam_mulai: string | null;
    jam_selesai: string | null;
    rombel: Rombel;
    created_at: string;
}
interface IndexProps {
    links: ClassroomLink[];
    rombels: Rombel[];
    jenjangList: Jenjang[];
}

const ACCENT = [
    { bar: 'bg-blue-500', icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700' },
    { bar: 'bg-violet-500', icon: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600', btn: 'bg-violet-600 hover:bg-violet-700' },
    { bar: 'bg-emerald-500', icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700' },
    { bar: 'bg-orange-500', icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600', btn: 'bg-orange-600 hover:bg-orange-700' },
    { bar: 'bg-pink-500', icon: 'bg-pink-100 dark:bg-pink-900/40 text-pink-600', btn: 'bg-pink-600 hover:bg-pink-700' },
    { bar: 'bg-cyan-500', icon: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600', btn: 'bg-cyan-600 hover:bg-cyan-700' },
];

const inputCls =
    'w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition text-sm';
const disabledCls = 'w-full px-4 py-3 rounded-xl border border-input bg-muted text-muted-foreground text-sm cursor-not-allowed opacity-60';

const formatDate = (d: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ── Shared form fields ────────────────────────────────────────
interface FieldProps {
    data: Record<string, string>;
    setData: (k: string, v: string) => void;
    errors: Record<string, string>;
    rombels: Rombel[];
    jenjangList: Jenjang[];
    isEdit: boolean;
    selectedJenjangId?: string;
    filteredRombels?: Rombel[];
    onJenjangChange?: (id: string) => void;
}

function LinkFormFields({ data, setData, errors, rombels, jenjangList, isEdit, selectedJenjangId, filteredRombels, onJenjangChange }: FieldProps) {
    return (
        <>
            {/* Jenjang — create only */}
            {!isEdit && (
                <div>
                    <label className="text-foreground mb-1.5 block flex items-center gap-1.5 text-sm font-semibold">
                        <Building2 className="h-4 w-4 text-indigo-500" /> Jenjang
                    </label>
                    <select value={selectedJenjangId} onChange={(e) => onJenjangChange?.(e.target.value)} className={inputCls} required>
                        <option value="">-- Pilih Jenjang --</option>
                        {jenjangList.map((j) => (
                            <option key={j.id} value={j.id}>
                                {j.nama}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Kelas */}
            <div>
                <label className="text-foreground mb-1.5 block flex items-center gap-1.5 text-sm font-semibold">
                    <GraduationCap className="h-4 w-4 text-emerald-500" /> Kelas Tujuan
                </label>
                {!isEdit && !selectedJenjangId ? (
                    <div className={disabledCls}>-- Pilih jenjang terlebih dahulu --</div>
                ) : (
                    <select value={data.rombel_id} onChange={(e) => setData('rombel_id', e.target.value)} className={inputCls} required>
                        <option value="">-- Pilih Kelas --</option>
                        {(isEdit ? rombels : (filteredRombels ?? [])).map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                )}
                {errors.rombel_id && <p className="mt-1 text-xs text-red-500">{errors.rombel_id}</p>}
                {!isEdit && selectedJenjangId && (filteredRombels ?? []).length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">Belum ada kelas untuk jenjang ini.</p>
                )}
            </div>

            {/* Mata Pelajaran */}
            <div>
                <label className="text-foreground mb-1.5 block text-sm font-semibold">Nama Mata Pelajaran</label>
                <input
                    type="text"
                    value={data.mapel}
                    onChange={(e) => setData('mapel', e.target.value)}
                    className={inputCls}
                    placeholder="Contoh: Matematika Peminatan"
                    required
                />
                {errors.mapel && <p className="mt-1 text-xs text-red-500">{errors.mapel}</p>}
            </div>

            {/* ── Jadwal Belajar ── */}
            <div className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                <div className="mb-1 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-indigo-500" />
                    <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">Jadwal Belajar</span>
                    <span className="text-muted-foreground text-xs font-normal">(Opsional)</span>
                </div>
                <div>
                    <label className="text-foreground mb-1 block text-xs font-medium">Hari Belajar</label>
                    <select value={data.hari_belajar} onChange={(e) => setData('hari_belajar', e.target.value)} className={inputCls}>
                        <option value="">-- Pilih Hari --</option>
                        <option value="Senin">Senin</option>
                        <option value="Selasa">Selasa</option>
                        <option value="Rabu">Rabu</option>
                        <option value="Kamis">Kamis</option>
                        <option value="Jumat">Jumat</option>
                        <option value="Sabtu">Sabtu</option>
                        <option value="Minggu">Minggu</option>
                    </select>
                    {errors.hari_belajar && <p className="mt-1 text-xs text-red-500">{errors.hari_belajar}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-foreground mb-1 block flex items-center gap-1 text-xs font-medium">
                            <Clock className="h-3.5 w-3.5 text-indigo-500" /> Jam Mulai
                        </label>
                        <input type="time" value={data.jam_mulai} onChange={(e) => setData('jam_mulai', e.target.value)} className={inputCls} />
                        {errors.jam_mulai && <p className="mt-1 text-xs text-red-500">{errors.jam_mulai}</p>}
                    </div>
                    <div>
                        <label className="text-foreground mb-1 block flex items-center gap-1 text-xs font-medium">
                            <Clock className="h-3.5 w-3.5 text-indigo-500" /> Jam Selesai
                        </label>
                        <input type="time" value={data.jam_selesai} onChange={(e) => setData('jam_selesai', e.target.value)} className={inputCls} />
                        {errors.jam_selesai && <p className="mt-1 text-xs text-red-500">{errors.jam_selesai}</p>}
                    </div>
                </div>
            </div>

            {/* Link Classroom */}
            <div>
                <label className="text-foreground mb-1.5 block text-sm font-semibold">
                    Tautan Google Classroom <span className="text-muted-foreground font-normal">(Opsional)</span>
                </label>
                <input
                    type="url"
                    value={data.link}
                    onChange={(e) => setData('link', e.target.value)}
                    className={inputCls}
                    placeholder="https://classroom.google.com/c/..."
                />
                {errors.link && <p className="mt-1 text-xs text-red-500">{errors.link}</p>}
            </div>

            {/* ── UTS ── */}
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                <div className="mb-1 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-amber-500" />
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Ujian Tengah Semester (UTS)</span>
                    <span className="text-muted-foreground text-xs font-normal">(Opsional)</span>
                </div>
                <div>
                    <label className="text-foreground mb-1 block text-xs font-medium">Link Google Form UTS</label>
                    <input
                        type="url"
                        value={data.link_uts}
                        onChange={(e) => setData('link_uts', e.target.value)}
                        className={inputCls}
                        placeholder="https://forms.google.com/..."
                    />
                    {errors.link_uts && <p className="mt-1 text-xs text-red-500">{errors.link_uts}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-foreground mb-1 block flex items-center gap-1 text-xs font-medium">
                            <CalendarDays className="h-3.5 w-3.5 text-amber-500" /> Tanggal Mulai
                        </label>
                        <input type="date" value={data.uts_mulai} onChange={(e) => setData('uts_mulai', e.target.value)} className={inputCls} />
                        {errors.uts_mulai && <p className="mt-1 text-xs text-red-500">{errors.uts_mulai}</p>}
                    </div>
                    <div>
                        <label className="text-foreground mb-1 block flex items-center gap-1 text-xs font-medium">
                            <CalendarDays className="h-3.5 w-3.5 text-amber-500" /> Tanggal Tutup
                        </label>
                        <input type="date" value={data.uts_tutup} onChange={(e) => setData('uts_tutup', e.target.value)} className={inputCls} />
                        {errors.uts_tutup && <p className="mt-1 text-xs text-red-500">{errors.uts_tutup}</p>}
                    </div>
                </div>
                <div>
                    <label className="text-foreground mb-1 block text-xs font-medium">Durasi Ujian (Menit)</label>
                    <input
                        type="number"
                        min="1"
                        value={data.uts_durasi}
                        onChange={(e) => setData('uts_durasi', e.target.value)}
                        className={inputCls}
                        placeholder="Contoh: 90"
                    />
                    {errors.uts_durasi && <p className="mt-1 text-xs text-red-500">{errors.uts_durasi}</p>}
                </div>
            </div>

            {/* ── UAS ── */}
            <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
                <div className="mb-1 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-rose-600" />
                    <span className="text-sm font-bold text-rose-700 dark:text-rose-400">Ujian Akhir Semester (UAS)</span>
                    <span className="text-muted-foreground text-xs font-normal">(Opsional)</span>
                </div>
                <div>
                    <label className="text-foreground mb-1 block text-xs font-medium">Link Google Form UAS</label>
                    <input
                        type="url"
                        value={data.link_uas}
                        onChange={(e) => setData('link_uas', e.target.value)}
                        className={inputCls}
                        placeholder="https://forms.google.com/..."
                    />
                    {errors.link_uas && <p className="mt-1 text-xs text-red-500">{errors.link_uas}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-foreground mb-1 block flex items-center gap-1 text-xs font-medium">
                            <CalendarDays className="h-3.5 w-3.5 text-rose-500" /> Tanggal Mulai
                        </label>
                        <input type="date" value={data.uas_mulai} onChange={(e) => setData('uas_mulai', e.target.value)} className={inputCls} />
                        {errors.uas_mulai && <p className="mt-1 text-xs text-red-500">{errors.uas_mulai}</p>}
                    </div>
                    <div>
                        <label className="text-foreground mb-1 block flex items-center gap-1 text-xs font-medium">
                            <CalendarDays className="h-3.5 w-3.5 text-rose-500" /> Tanggal Tutup
                        </label>
                        <input type="date" value={data.uas_tutup} onChange={(e) => setData('uas_tutup', e.target.value)} className={inputCls} />
                        {errors.uas_tutup && <p className="mt-1 text-xs text-red-500">{errors.uas_tutup}</p>}
                    </div>
                </div>
                <div>
                    <label className="text-foreground mb-1 block text-xs font-medium">Durasi Ujian (Menit)</label>
                    <input
                        type="number"
                        min="1"
                        value={data.uas_durasi}
                        onChange={(e) => setData('uas_durasi', e.target.value)}
                        className={inputCls}
                        placeholder="Contoh: 90"
                    />
                    {errors.uas_durasi && <p className="mt-1 text-xs text-red-500">{errors.uas_durasi}</p>}
                </div>
            </div>

            {/* Keterangan */}
            <div>
                <label className="text-foreground mb-1.5 block text-sm font-semibold">
                    Keterangan <span className="text-muted-foreground font-normal">(Opsional)</span>
                </label>
                <textarea
                    value={data.keterangan}
                    onChange={(e) => setData('keterangan', e.target.value)}
                    className={`${inputCls} min-h-[80px] resize-none`}
                    placeholder="Contoh: Kode kelas: abcxyz12"
                />
            </div>
        </>
    );
}

// ── Modal wrapper ─────────────────────────────────────────────
function Modal({
    open,
    onClose,
    title,
    subtitle,
    icon,
    accentClass,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    accentClass: string;
    children: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-card border-border flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl">
                <div className="border-border flex flex-shrink-0 items-center justify-between border-b px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentClass}`}>{icon}</div>
                        <div>
                            <h2 className="text-foreground text-base font-bold">{title}</h2>
                            {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:bg-muted rounded-lg p-1.5 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────
const emptyForm = {
    rombel_id: '',
    mapel: '',
    link: '',
    link_uts: '',
    uts_mulai: '',
    uts_tutup: '',
    uts_durasi: '',
    link_uas: '',
    uas_mulai: '',
    uas_tutup: '',
    uas_durasi: '',
    keterangan: '',
    hari_belajar: '',
    jam_mulai: '',
    jam_selesai: '',
};

export default function Index({ links, rombels, jenjangList }: IndexProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<ClassroomLink | null>(null);
    const [selectedJenjangId, setSelectedJenjangId] = useState('');

    const filteredRombels = useMemo(
        () => (selectedJenjangId ? rombels.filter((r) => String(r.jenjang_id) === selectedJenjangId) : []),
        [selectedJenjangId, rombels],
    );

    const createForm = useForm({ ...emptyForm });
    const editForm = useForm({ ...emptyForm });

    // Create handlers
    const openCreate = () => {
        createForm.reset();
        setSelectedJenjangId('');
        setIsCreateOpen(true);
    };
    const closeCreate = () => {
        setIsCreateOpen(false);
        createForm.reset();
        setSelectedJenjangId('');
    };
    const handleJenjangChange = (id: string) => {
        setSelectedJenjangId(id);
        createForm.setData('rombel_id', '');
    };
    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('guru.classroom-links.store'), { onSuccess: closeCreate });
    };

    // Edit handlers
    const openEdit = (link: ClassroomLink) => {
        setEditingLink(link);
        editForm.setData({
            rombel_id: String(link.rombel?.id ?? ''),
            mapel: link.mapel ?? '',
            link: link.link ?? '',
            link_uts: link.link_uts ?? '',
            uts_mulai: link.uts_mulai ?? '',
            uts_tutup: link.uts_tutup ?? '',
            uts_durasi: link.uts_durasi ? String(link.uts_durasi) : '',
            link_uas: link.link_uas ?? '',
            uas_mulai: link.uas_mulai ?? '',
            uas_tutup: link.uas_tutup ?? '',
            uas_durasi: link.uas_durasi ? String(link.uas_durasi) : '',
            keterangan: link.keterangan ?? '',
            hari_belajar: link.hari_belajar ?? '',
            jam_mulai: link.jam_mulai ? link.jam_mulai.substring(0, 5) : '',
            jam_selesai: link.jam_selesai ? link.jam_selesai.substring(0, 5) : '',
        });
    };
    const closeEdit = () => {
        setEditingLink(null);
        editForm.reset();
    };
    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLink) return;
        editForm.put(route('guru.classroom-links.update', editingLink.id), { onSuccess: closeEdit });
    };

    const handleDelete = (id: number) => {
        if (confirm('Hapus tautan kelas ini?')) createForm.delete(route('guru.classroom-links.destroy', id));
    };

    const grouped = links.reduce<Record<string, { rombel: Rombel; items: ClassroomLink[] }>>((acc, link) => {
        const key = String(link.rombel?.id);
        if (!acc[key]) acc[key] = { rombel: link.rombel, items: [] };
        acc[key].items.push(link);
        return acc;
    }, {});

    return (
        <AppLayout breadcrumbs={[{ title: 'Tautan Kelas', href: '/guru/classroom-links' }]}>
            <Head title="Tautan Google Classroom" />
            <div className="w-full p-4 sm:p-6 lg:p-10">
                {/* Header */}
                <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-300/40">
                            <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-foreground text-2xl font-extrabold tracking-tight">Tautan Google Classroom</h1>
                            <p className="text-muted-foreground mt-0.5 text-sm">
                                {links.length} tautan aktif · {Object.keys(grouped).length} kelas
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 self-start rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-300/40 transition-all hover:bg-blue-700 active:scale-95 sm:self-auto"
                    >
                        <Plus className="h-4 w-4" /> Tambah Tautan Baru
                    </button>
                </div>

                {/* Empty */}
                {links.length === 0 && (
                    <div className="border-border flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-24 text-center">
                        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/30">
                            <School className="h-12 w-12 text-blue-400" />
                        </div>
                        <h3 className="text-foreground mb-2 text-xl font-bold">Belum ada tautan kelas</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm text-sm leading-relaxed">
                            Bagikan tautan Google Classroom ke siswa agar mereka bisa bergabung ke kelas digital Anda.
                        </p>
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" /> Tambah Tautan Sekarang
                        </button>
                    </div>
                )}

                {/* Grouped list */}
                <div className="space-y-10">
                    {Object.values(grouped).map(({ rombel, items }) => (
                        <div key={rombel.id}>
                            <div className="border-border mb-4 flex items-center gap-3 border-b pb-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/30">
                                    <GraduationCap className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div className="flex items-center gap-2">
                                    {rombel.jenjang && (
                                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                            {rombel.jenjang.nama}
                                        </span>
                                    )}
                                    <h2 className="text-foreground text-lg font-bold">Kelas {rombel.name}</h2>
                                </div>
                                <span className="bg-muted text-muted-foreground ml-1 rounded-full px-2.5 py-1 text-xs font-medium">
                                    {items.length} mata pelajaran
                                </span>
                            </div>

                            <div className="space-y-3">
                                {items.map((link, i) => {
                                    const ac = ACCENT[i % ACCENT.length];
                                    return (
                                        <div
                                            key={link.id}
                                            className="group bg-card border-border flex w-full flex-col gap-4 overflow-hidden rounded-2xl border p-0 transition-all duration-300 hover:border-blue-200 hover:shadow-lg sm:flex-row sm:items-start dark:hover:border-blue-900"
                                        >
                                            <div className={`hidden w-1.5 flex-shrink-0 self-stretch sm:block ${ac.bar} rounded-l-2xl`} />
                                            <div className={`h-1.5 w-full sm:hidden ${ac.bar}`} />

                                            <div className="flex min-w-0 flex-1 items-start gap-4 px-5 py-4 sm:pl-3">
                                                <div
                                                    className={`mt-0.5 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${ac.icon}`}
                                                >
                                                    <BookOpen className="h-6 w-6" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-foreground truncate text-base font-bold">{link.mapel}</h3>
                                                    {link.keterangan && (
                                                        <p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">{link.keterangan}</p>
                                                    )}

                                                    {/* Jadwal belajar badge */}
                                                    {(link.hari_belajar || link.jam_mulai) && (
                                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                            {link.hari_belajar && (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                                                                    <CalendarDays className="h-3 w-3" />
                                                                    {link.hari_belajar}
                                                                </span>
                                                            )}
                                                            {(link.jam_mulai || link.jam_selesai) && (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                                                                    <Clock className="h-3 w-3" />
                                                                    {link.jam_mulai ?? '?'}
                                                                    {link.jam_selesai ? ` – ${link.jam_selesai}` : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {(link.uts_mulai || link.uts_tutup) && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                                                <CalendarDays className="h-3 w-3" />
                                                                UTS: {formatDate(link.uts_mulai)}
                                                                {link.uts_tutup ? ` – ${formatDate(link.uts_tutup)}` : ''}
                                                            </span>
                                                        )}
                                                        {(link.uas_mulai || link.uas_tutup) && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                                                                <CalendarDays className="h-3 w-3" />
                                                                UAS: {formatDate(link.uas_mulai)}
                                                                {link.uas_tutup ? ` – ${formatDate(link.uas_tutup)}` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-shrink-0 flex-wrap items-center gap-2 px-5 pb-4 sm:pt-4 sm:pr-5 sm:pb-0">
                                                {link.link && (
                                                    <a
                                                        href={link.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition-all ${ac.btn}`}
                                                    >
                                                        <ExternalLink className="h-4 w-4" /> Classroom
                                                    </a>
                                                )}
                                                {link.link_uts && (
                                                    <a
                                                        href={link.link_uts}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition-all hover:bg-amber-600"
                                                    >
                                                        <FileText className="h-4 w-4" /> Form UTS
                                                    </a>
                                                )}
                                                {link.link_uas && (
                                                    <a
                                                        href={link.link_uas}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition-all hover:bg-rose-700"
                                                    >
                                                        <ClipboardList className="h-4 w-4" /> Form UAS
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => openEdit(link)}
                                                    className="border-border text-muted-foreground rounded-xl border p-2.5 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30"
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(link.id)}
                                                    className="border-border text-muted-foreground rounded-xl border p-2.5 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="h-4 w-4" />
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

            {/* ══ MODAL CREATE ══ */}
            <Modal
                open={isCreateOpen}
                onClose={closeCreate}
                title="Buat Tautan Kelas Baru"
                accentClass="bg-blue-100 dark:bg-blue-950/30"
                icon={<LinkIcon className="h-4 w-4 text-blue-600" />}
            >
                <form onSubmit={submitCreate} className="relative flex h-full flex-col">
                    <div className="space-y-4 p-4 sm:p-6">
                        <LinkFormFields
                            data={createForm.data as Record<string, string>}
                            setData={(k, v) => createForm.setData(k as keyof typeof createForm.data, v)}
                            errors={createForm.errors}
                            rombels={rombels}
                            jenjangList={jenjangList}
                            isEdit={false}
                            selectedJenjangId={selectedJenjangId}
                            filteredRombels={filteredRombels}
                            onJenjangChange={handleJenjangChange}
                        />
                    </div>
                    <div className="bg-card border-border sticky bottom-0 z-10 mt-auto flex justify-end gap-3 border-t px-4 py-4 sm:px-6">
                        <button
                            type="button"
                            onClick={closeCreate}
                            className="border-border hover:bg-muted rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={createForm.processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                        >
                            {createForm.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                            Bagikan Tautan
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ══ MODAL EDIT ══ */}
            <Modal
                open={!!editingLink}
                onClose={closeEdit}
                title="Edit Tautan Kelas"
                subtitle={editingLink?.mapel}
                accentClass="bg-amber-100 dark:bg-amber-950/30"
                icon={<Pencil className="h-4 w-4 text-amber-600" />}
            >
                <form onSubmit={submitEdit} className="relative flex h-full flex-col">
                    <div className="space-y-4 p-4 sm:p-6">
                        <LinkFormFields
                            data={editForm.data as Record<string, string>}
                            setData={(k, v) => editForm.setData(k as keyof typeof editForm.data, v)}
                            errors={editForm.errors}
                            rombels={rombels}
                            jenjangList={jenjangList}
                            isEdit={true}
                        />
                    </div>
                    <div className="bg-card border-border sticky bottom-0 z-10 mt-auto flex justify-end gap-3 border-t px-4 py-4 sm:px-6">
                        <button
                            type="button"
                            onClick={closeEdit}
                            className="border-border hover:bg-muted rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={editForm.processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600 disabled:opacity-50"
                        >
                            {editForm.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
