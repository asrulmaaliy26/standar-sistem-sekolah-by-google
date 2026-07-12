import React, { useState, useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Plus, Trash2, ExternalLink, BookOpen, School, X, Loader2,
    GraduationCap, Link as LinkIcon, FileText, ClipboardList,
    Building2, Pencil, CalendarDays,
} from 'lucide-react';

interface Jenjang { id: number; nama: string; }
interface Rombel { id: number; name: string; jenjang_id: number; jenjang?: Jenjang; }
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
    rombel: Rombel;
    created_at: string;
}
interface IndexProps { links: ClassroomLink[]; rombels: Rombel[]; jenjangList: Jenjang[]; }

const ACCENT = [
    { bar: 'bg-blue-500',    icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600',    btn: 'bg-blue-600 hover:bg-blue-700' },
    { bar: 'bg-violet-500',  icon: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600',  btn: 'bg-violet-600 hover:bg-violet-700' },
    { bar: 'bg-emerald-500', icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700' },
    { bar: 'bg-orange-500',  icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600',  btn: 'bg-orange-600 hover:bg-orange-700' },
    { bar: 'bg-pink-500',    icon: 'bg-pink-100 dark:bg-pink-900/40 text-pink-600',    btn: 'bg-pink-600 hover:bg-pink-700' },
    { bar: 'bg-cyan-500',    icon: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600',    btn: 'bg-cyan-600 hover:bg-cyan-700' },
];

const inputCls = 'w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition text-sm';
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
                    <label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-indigo-500" /> Jenjang
                    </label>
                    <select value={selectedJenjangId} onChange={e => onJenjangChange?.(e.target.value)} className={inputCls} required>
                        <option value="">-- Pilih Jenjang --</option>
                        {jenjangList.map(j => <option key={j.id} value={j.id}>{j.nama}</option>)}
                    </select>
                </div>
            )}

            {/* Kelas */}
            <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-500" /> Kelas Tujuan
                </label>
                {!isEdit && !selectedJenjangId
                    ? <div className={disabledCls}>-- Pilih jenjang terlebih dahulu --</div>
                    : (
                        <select value={data.rombel_id} onChange={e => setData('rombel_id', e.target.value)} className={inputCls} required>
                            <option value="">-- Pilih Kelas --</option>
                            {(isEdit ? rombels : (filteredRombels ?? [])).map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    )}
                {errors.rombel_id && <p className="text-red-500 text-xs mt-1">{errors.rombel_id}</p>}
                {!isEdit && selectedJenjangId && (filteredRombels ?? []).length === 0 && (
                    <p className="text-amber-600 text-xs mt-1">Belum ada kelas untuk jenjang ini.</p>
                )}
            </div>

            {/* Mata Pelajaran */}
            <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Nama Mata Pelajaran</label>
                <input type="text" value={data.mapel} onChange={e => setData('mapel', e.target.value)} className={inputCls} placeholder="Contoh: Matematika Peminatan" required />
                {errors.mapel && <p className="text-red-500 text-xs mt-1">{errors.mapel}</p>}
            </div>

            {/* Link Classroom */}
            <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Tautan Google Classroom <span className="text-muted-foreground font-normal">(Opsional)</span>
                </label>
                <input type="url" value={data.link} onChange={e => setData('link', e.target.value)} className={inputCls} placeholder="https://classroom.google.com/c/..." />
                {errors.link && <p className="text-red-500 text-xs mt-1">{errors.link}</p>}
            </div>

            {/* ── UTS ── */}
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Ujian Tengah Semester (UTS)</span>
                    <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
                </div>
                <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Link Google Form UTS</label>
                    <input type="url" value={data.link_uts} onChange={e => setData('link_uts', e.target.value)} className={inputCls} placeholder="https://forms.google.com/..." />
                    {errors.link_uts && <p className="text-red-500 text-xs mt-1">{errors.link_uts}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5 text-amber-500" /> Tanggal Mulai
                        </label>
                        <input type="date" value={data.uts_mulai} onChange={e => setData('uts_mulai', e.target.value)} className={inputCls} />
                        {errors.uts_mulai && <p className="text-red-500 text-xs mt-1">{errors.uts_mulai}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5 text-amber-500" /> Tanggal Tutup
                        </label>
                        <input type="date" value={data.uts_tutup} onChange={e => setData('uts_tutup', e.target.value)} className={inputCls} />
                        {errors.uts_tutup && <p className="text-red-500 text-xs mt-1">{errors.uts_tutup}</p>}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Durasi Ujian (Menit)</label>
                    <input type="number" min="1" value={data.uts_durasi} onChange={e => setData('uts_durasi', e.target.value)} className={inputCls} placeholder="Contoh: 90" />
                    {errors.uts_durasi && <p className="text-red-500 text-xs mt-1">{errors.uts_durasi}</p>}
                </div>
            </div>

            {/* ── UAS ── */}
            <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 flex-shrink-0" />
                    <span className="text-sm font-bold text-rose-700 dark:text-rose-400">Ujian Akhir Semester (UAS)</span>
                    <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
                </div>
                <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Link Google Form UAS</label>
                    <input type="url" value={data.link_uas} onChange={e => setData('link_uas', e.target.value)} className={inputCls} placeholder="https://forms.google.com/..." />
                    {errors.link_uas && <p className="text-red-500 text-xs mt-1">{errors.link_uas}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5 text-rose-500" /> Tanggal Mulai
                        </label>
                        <input type="date" value={data.uas_mulai} onChange={e => setData('uas_mulai', e.target.value)} className={inputCls} />
                        {errors.uas_mulai && <p className="text-red-500 text-xs mt-1">{errors.uas_mulai}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5 text-rose-500" /> Tanggal Tutup
                        </label>
                        <input type="date" value={data.uas_tutup} onChange={e => setData('uas_tutup', e.target.value)} className={inputCls} />
                        {errors.uas_tutup && <p className="text-red-500 text-xs mt-1">{errors.uas_tutup}</p>}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Durasi Ujian (Menit)</label>
                    <input type="number" min="1" value={data.uas_durasi} onChange={e => setData('uas_durasi', e.target.value)} className={inputCls} placeholder="Contoh: 90" />
                    {errors.uas_durasi && <p className="text-red-500 text-xs mt-1">{errors.uas_durasi}</p>}
                </div>
            </div>

            {/* Keterangan */}
            <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Keterangan <span className="text-muted-foreground font-normal">(Opsional)</span>
                </label>
                <textarea value={data.keterangan} onChange={e => setData('keterangan', e.target.value)} className={`${inputCls} min-h-[80px] resize-none`} placeholder="Contoh: Kode kelas: abcxyz12" />
            </div>
        </>
    );
}

// ── Modal wrapper ─────────────────────────────────────────────
function Modal({ open, onClose, title, subtitle, icon, accentClass, children }: {
    open: boolean; onClose: () => void; title: string; subtitle?: string;
    icon: React.ReactNode; accentClass: string; children: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accentClass}`}>{icon}</div>
                        <div>
                            <h2 className="text-base font-bold text-foreground">{title}</h2>
                            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="overflow-y-auto flex-1">{children}</div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────
const emptyForm = { rombel_id: '', mapel: '', link: '', link_uts: '', uts_mulai: '', uts_tutup: '', uts_durasi: '', link_uas: '', uas_mulai: '', uas_tutup: '', uas_durasi: '', keterangan: '' };

export default function Index({ links, rombels, jenjangList }: IndexProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<ClassroomLink | null>(null);
    const [selectedJenjangId, setSelectedJenjangId] = useState('');

    const filteredRombels = useMemo(() =>
        selectedJenjangId ? rombels.filter(r => String(r.jenjang_id) === selectedJenjangId) : [],
        [selectedJenjangId, rombels]);

    const createForm = useForm({ ...emptyForm });
    const editForm   = useForm({ ...emptyForm });

    // Create handlers
    const openCreate  = () => { createForm.reset(); setSelectedJenjangId(''); setIsCreateOpen(true); };
    const closeCreate = () => { setIsCreateOpen(false); createForm.reset(); setSelectedJenjangId(''); };
    const handleJenjangChange = (id: string) => { setSelectedJenjangId(id); createForm.setData('rombel_id', ''); };
    const submitCreate = (e: React.FormEvent) => { e.preventDefault(); createForm.post(route('guru.classroom-links.store'), { onSuccess: closeCreate }); };

    // Edit handlers
    const openEdit = (link: ClassroomLink) => {
        setEditingLink(link);
        editForm.setData({
            rombel_id: String(link.rombel?.id ?? ''),
            mapel:     link.mapel ?? '',
            link:      link.link ?? '',
            link_uts:  link.link_uts ?? '',
            uts_mulai: link.uts_mulai ?? '',
            uts_tutup: link.uts_tutup ?? '',
            uts_durasi: link.uts_durasi ? String(link.uts_durasi) : '',
            link_uas:  link.link_uas ?? '',
            uas_mulai: link.uas_mulai ?? '',
            uas_tutup: link.uas_tutup ?? '',
            uas_durasi: link.uas_durasi ? String(link.uas_durasi) : '',
            keterangan: link.keterangan ?? '',
        });
    };
    const closeEdit  = () => { setEditingLink(null); editForm.reset(); };
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
            <div className="p-6 lg:p-10 w-full">

                {/* Header */}
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
                    <button onClick={openCreate} className="self-start sm:self-auto inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 active:scale-95 transition-all font-semibold shadow-lg shadow-blue-300/40 text-sm">
                        <Plus className="w-4 h-4" /> Tambah Tautan Baru
                    </button>
                </div>

                {/* Empty */}
                {links.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-border rounded-2xl text-center">
                        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center mb-6">
                            <School className="w-12 h-12 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Belum ada tautan kelas</h3>
                        <p className="text-muted-foreground max-w-sm mb-6 text-sm leading-relaxed">Bagikan tautan Google Classroom ke siswa agar mereka bisa bergabung ke kelas digital Anda.</p>
                        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold text-sm">
                            <Plus className="w-4 h-4" /> Tambah Tautan Sekarang
                        </button>
                    </div>
                )}

                {/* Grouped list */}
                <div className="space-y-10">
                    {Object.values(grouped).map(({ rombel, items }) => (
                        <div key={rombel.id}>
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex items-center gap-2">
                                    {rombel.jenjang && (
                                        <span className="text-xs bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-full px-2 py-0.5 font-semibold">{rombel.jenjang.nama}</span>
                                    )}
                                    <h2 className="text-lg font-bold text-foreground">Kelas {rombel.name}</h2>
                                </div>
                                <span className="ml-1 text-xs bg-muted text-muted-foreground rounded-full px-2.5 py-1 font-medium">{items.length} mata pelajaran</span>
                            </div>

                            <div className="space-y-3">
                                {items.map((link, i) => {
                                    const ac = ACCENT[i % ACCENT.length];
                                    return (
                                        <div key={link.id} className="group w-full flex flex-col sm:flex-row sm:items-start gap-4 bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300 p-0">
                                            <div className={`hidden sm:block w-1.5 self-stretch flex-shrink-0 ${ac.bar} rounded-l-2xl`} />
                                            <div className={`sm:hidden h-1.5 w-full ${ac.bar}`} />

                                            <div className="flex items-start gap-4 flex-1 px-5 py-4 sm:pl-3 min-w-0">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${ac.icon}`}>
                                                    <BookOpen className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-foreground text-base truncate">{link.mapel}</h3>
                                                    {link.keterangan && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{link.keterangan}</p>}

                                                    {/* Date badges */}
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {(link.uts_mulai || link.uts_tutup) && (
                                                            <span className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-full px-2.5 py-1 font-medium">
                                                                <CalendarDays className="w-3 h-3" />
                                                                UTS: {formatDate(link.uts_mulai)}{link.uts_tutup ? ` – ${formatDate(link.uts_tutup)}` : ''}
                                                            </span>
                                                        )}
                                                        {(link.uas_mulai || link.uas_tutup) && (
                                                            <span className="inline-flex items-center gap-1 text-xs bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-full px-2.5 py-1 font-medium">
                                                                <CalendarDays className="w-3 h-3" />
                                                                UAS: {formatDate(link.uas_mulai)}{link.uas_tutup ? ` – ${formatDate(link.uas_tutup)}` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-wrap items-center gap-2 px-5 pb-4 sm:pb-0 sm:pr-5 sm:pt-4 flex-shrink-0">
                                                {link.link && (
                                                    <a href={link.link} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-xl font-semibold text-sm shadow-sm transition-all whitespace-nowrap ${ac.btn}`}>
                                                        <ExternalLink className="w-4 h-4" /> Classroom
                                                    </a>
                                                )}
                                                {link.link_uts && (
                                                    <a href={link.link_uts} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-sm shadow-sm transition-all whitespace-nowrap">
                                                        <FileText className="w-4 h-4" /> Form UTS
                                                    </a>
                                                )}
                                                {link.link_uas && (
                                                    <a href={link.link_uas} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all whitespace-nowrap">
                                                        <ClipboardList className="w-4 h-4" /> Form UAS
                                                    </a>
                                                )}
                                                <button onClick={() => openEdit(link)} className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors" title="Edit">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(link.id)} className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Hapus">
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

            {/* ══ MODAL CREATE ══ */}
            <Modal open={isCreateOpen} onClose={closeCreate} title="Buat Tautan Kelas Baru"
                accentClass="bg-blue-100 dark:bg-blue-950/30" icon={<LinkIcon className="w-4 h-4 text-blue-600" />}>
                <form onSubmit={submitCreate} className="p-6 space-y-4">
                    <LinkFormFields
                        data={createForm.data as Record<string, string>}
                        setData={(k, v) => createForm.setData(k as keyof typeof createForm.data, v)}
                        errors={createForm.errors}
                        rombels={rombels} jenjangList={jenjangList}
                        isEdit={false}
                        selectedJenjangId={selectedJenjangId}
                        filteredRombels={filteredRombels}
                        onJenjangChange={handleJenjangChange}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={closeCreate} className="px-5 py-2.5 border border-border rounded-xl hover:bg-muted text-sm font-medium transition-colors">Batal</button>
                        <button type="submit" disabled={createForm.processing} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold transition-colors">
                            {createForm.processing && <Loader2 className="w-4 h-4 animate-spin" />}
                            Bagikan Tautan
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ══ MODAL EDIT ══ */}
            <Modal open={!!editingLink} onClose={closeEdit} title="Edit Tautan Kelas" subtitle={editingLink?.mapel}
                accentClass="bg-amber-100 dark:bg-amber-950/30" icon={<Pencil className="w-4 h-4 text-amber-600" />}>
                <form onSubmit={submitEdit} className="p-6 space-y-4">
                    <LinkFormFields
                        data={editForm.data as Record<string, string>}
                        setData={(k, v) => editForm.setData(k as keyof typeof editForm.data, v)}
                        errors={editForm.errors}
                        rombels={rombels} jenjangList={jenjangList}
                        isEdit={true}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={closeEdit} className="px-5 py-2.5 border border-border rounded-xl hover:bg-muted text-sm font-medium transition-colors">Batal</button>
                        <button type="submit" disabled={editForm.processing} className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 text-sm font-semibold transition-colors">
                            {editForm.processing && <Loader2 className="w-4 h-4 animate-spin" />}
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
