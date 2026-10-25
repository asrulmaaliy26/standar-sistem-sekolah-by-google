import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    BookOpen,
    Plus,
    Users,
    UserCheck,
    Edit2,
    Trash2,
    UserPlus,
    UserMinus,
    Search,
    Filter,
    X,
    GraduationCap,
    Layers,
    ExternalLink,
} from 'lucide-react';

interface Wali {
    id: number;
    name: string;
    email: string;
}

interface Santri {
    id: number;
    name: string;
    email: string;
    madin_kelas_id?: number | null;
}

interface MadinKelasItem {
    id: number;
    nama_kelas: string;
    tingkat: 'Ula' | 'Wustho' | 'Ulya';
    wali_kelas_id: number | null;
    wali_kelas: Wali | null;
    deskripsi: string | null;
    santri: Santri[];
    santri_count: number;
    classroom_links_count: number;
}

interface Props {
    madinKelas: MadinKelasItem[];
    walis: Wali[];
    availableSantri: Santri[];
}

export default function MadinIndex({ madinKelas = [], walis = [], availableSantri = [] }: Props) {
    const [search, setSearch] = useState('');
    const [tingkatFilter, setTingkatFilter] = useState<'ALL' | 'Ula' | 'Wustho' | 'Ulya'>('ALL');

    // Modal state untuk Tambah / Edit Kelas Madin
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingMadin, setEditingMadin] = useState<MadinKelasItem | null>(null);
    const [formData, setFormData] = useState({
        nama_kelas: '',
        tingkat: 'Ula' as 'Ula' | 'Wustho' | 'Ulya',
        wali_kelas_id: '' as string | number,
        deskripsi: '',
    });
    const [submitting, setSubmitting] = useState(false);

    // Modal state untuk Kelola Santri Madin
    const [plottingMadin, setPlottingMadin] = useState<MadinKelasItem | null>(null);
    const [selectedSantriId, setSelectedSantriId] = useState('');
    const [plottingLoading, setPlottingLoading] = useState(false);

    // Filter list
    const filteredMadin = madinKelas.filter((m) => {
        const matchSearch =
            m.nama_kelas.toLowerCase().includes(search.toLowerCase()) ||
            (m.wali_kelas && m.wali_kelas.name.toLowerCase().includes(search.toLowerCase()));
        const matchTingkat = tingkatFilter === 'ALL' || m.tingkat === tingkatFilter;
        return matchSearch && matchTingkat;
    });

    // Statistik
    const totalKelas = madinKelas.length;
    const totalSantri = madinKelas.reduce((acc, m) => acc + (m.santri_count || 0), 0);
    const kelasUla = madinKelas.filter((m) => m.tingkat === 'Ula').length;
    const kelasWustho = madinKelas.filter((m) => m.tingkat === 'Wustho').length;
    const kelasUlya = madinKelas.filter((m) => m.tingkat === 'Ulya').length;

    // Buka modal create
    const openCreateModal = () => {
        setEditingMadin(null);
        setFormData({
            nama_kelas: '',
            tingkat: 'Ula',
            wali_kelas_id: '',
            deskripsi: '',
        });
        setIsFormModalOpen(true);
    };

    // Buka modal edit
    const openEditModal = (item: MadinKelasItem) => {
        setEditingMadin(item);
        setFormData({
            nama_kelas: item.nama_kelas,
            tingkat: item.tingkat,
            wali_kelas_id: item.wali_kelas_id || '',
            deskripsi: item.deskripsi || '',
        });
        setIsFormModalOpen(true);
    };

    // Submit form madin
    const handleSubmitMadin = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            ...formData,
            wali_kelas_id: formData.wali_kelas_id ? Number(formData.wali_kelas_id) : null,
        };

        if (editingMadin) {
            router.put(route('admin.madin-kelas.update', editingMadin.id), payload, {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    setSubmitting(false);
                },
                onError: () => setSubmitting(false),
            });
        } else {
            router.post(route('admin.madin-kelas.store'), payload, {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    setSubmitting(false);
                },
                onError: () => setSubmitting(false),
            });
        }
    };

    // Hapus kelas madin
    const handleDeleteMadin = (item: MadinKelasItem) => {
        if (!confirm(`Hapus kelas "${item.nama_kelas}"? Santri di kelas ini akan dilepas.`)) return;

        router.delete(route('admin.madin-kelas.destroy', item.id));
    };

    // Masukkan santri ke kelas madin
    const handleAssignSantri = (e: React.FormEvent) => {
        e.preventDefault();
        if (!plottingMadin || !selectedSantriId) return;

        setPlottingLoading(true);
        router.post(
            route('admin.madin-kelas.assign-santri', plottingMadin.id),
            { user_id: selectedSantriId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedSantriId('');
                    setPlottingLoading(false);
                    const updated = madinKelas.find((m) => m.id === plottingMadin.id);
                    if (updated) setPlottingMadin(updated);
                },
                onError: () => setPlottingLoading(false),
            }
        );
    };

    // Keluarkan santri dari kelas madin
    const handleRemoveSantri = (santriId: number) => {
        if (!plottingMadin) return;

        setPlottingLoading(true);
        router.post(
            route('admin.madin-kelas.remove-santri', plottingMadin.id),
            { user_id: santriId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setPlottingLoading(false);
                    const updated = madinKelas.find((m) => m.id === plottingMadin.id);
                    if (updated) setPlottingMadin(updated);
                },
                onError: () => setPlottingLoading(false),
            }
        );
    };

    // Santri yang belum masuk kelas madin ini
    const unassignedSantri = availableSantri.filter((s) => {
        if (!plottingMadin) return true;
        return s.madin_kelas_id !== plottingMadin.id;
    });

    const getTingkatBadge = (tingkat: string) => {
        switch (tingkat) {
            case 'Ula':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
            case 'Wustho':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
            case 'Ulya':
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Panel Admin', href: '/admin/dashboard' }, { title: 'Kelas Madrasah Diniyah', href: '/admin/madin-kelas' }]}>
            <Head title="Kelas Madrasah Diniyah (Madin)" />

            <div className="p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto space-y-8">
                {/* ── Banner Header ── */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-purple-800 to-slate-900 p-8 text-white shadow-xl">
                    <div className="absolute -top-12 -right-12 w-56 h-56 bg-purple-400/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-8 left-12 w-44 h-44 bg-indigo-400/10 rounded-full blur-2xl" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold mb-3">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Pilar Madrasah Diniyah</span>
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight">Kelas Madrasah Diniyah (Madin)</h1>
                            <p className="text-purple-100/80 text-sm mt-1 max-w-xl">
                                Kelola tingkatan kelas kitab (Ula, Wustho, Ulya), ustadz wali kelas, dan penempatan santri berdasarkan kompetensi keagamaan.
                            </p>
                        </div>

                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-400 hover:bg-purple-300 text-slate-950 font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all self-start md:self-auto cursor-pointer"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Tambah Kelas Madin</span>
                        </button>
                    </div>
                </div>

                {/* ── Ringkasan Statistik ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Total Kelas</span>
                            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                                <BookOpen className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2">{totalKelas}</p>
                        <p className="text-xs text-muted-foreground mt-1">Kelas Madin aktif</p>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Santri Terdaftar</span>
                            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2">{totalSantri}</p>
                        <p className="text-xs text-muted-foreground mt-1">Santri mengikuti Madin</p>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Tingkat Ula</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                Dasar
                            </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">{kelasUla}</p>
                        <p className="text-xs text-muted-foreground mt-1">Kelas dasar kitab</p>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Wustho & Ulya</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                Menengah & Lanjut
                            </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-2">{kelasWustho + kelasUlya}</p>
                        <p className="text-xs text-muted-foreground mt-1">{kelasWustho} Wustho • {kelasUlya} Ulya</p>
                    </div>
                </div>

                {/* ── Filter & Search Bar ── */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari kelas madin, wali kelas..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">Tingkat:</span>
                        <div className="inline-flex rounded-xl border border-border p-1 bg-muted/40">
                            {(['ALL', 'Ula', 'Wustho', 'Ulya'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTingkatFilter(t)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                                        tingkatFilter === t ? 'bg-purple-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {t === 'ALL' ? 'Semua' : t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Grid Kelas Madin ── */}
                {filteredMadin.length === 0 ? (
                    <div className="text-center py-16 bg-card border border-dashed border-border rounded-3xl p-8">
                        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <h3 className="text-lg font-bold text-foreground">Tidak Ada Kelas Madin</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                            {madinKelas.length === 0
                                ? 'Belum ada data kelas Madrasah Diniyah. Klik Tambah Kelas Madin untuk membuat kelas baru.'
                                : 'Tidak ada kelas yang cocok dengan kata kunci pencarian Anda.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMadin.map((item) => (
                            <div
                                key={item.id}
                                className="group relative bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                            >
                                <div>
                                    {/* Header Card */}
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 border border-purple-200 dark:border-purple-800 flex items-center justify-center font-bold text-lg shadow-sm">
                                                <GraduationCap className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-lg text-foreground group-hover:text-purple-600 transition-colors">
                                                    {item.nama_kelas}
                                                </h3>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Layers className="w-3.5 h-3.5" />
                                                    Tingkat: <span className="font-semibold text-foreground">{item.tingkat}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getTingkatBadge(item.tingkat)}`}>
                                            {item.tingkat}
                                        </span>
                                    </div>

                                    {/* Wali Kelas Madin */}
                                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-1 mb-4">
                                        <span className="text-muted-foreground font-medium">Ustadz / Wali Kelas:</span>
                                        <p className="font-bold text-foreground flex items-center gap-1.5">
                                            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                                            {item.wali_kelas ? item.wali_kelas.name : <span className="text-muted-foreground italic">Belum ditentukan</span>}
                                        </p>
                                    </div>

                                    {/* Keterangan */}
                                    {item.deskripsi && (
                                        <p className="text-xs text-muted-foreground italic line-clamp-2 mb-4">
                                            "{item.deskripsi}"
                                        </p>
                                    )}

                                    {/* Info Santri & Classroom */}
                                    <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground mb-4">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4 text-purple-600" />
                                            <strong className="text-foreground">{item.santri_count || 0}</strong> Santri
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-4 h-4 text-indigo-600" />
                                            <strong className="text-foreground">{item.classroom_links_count || 0}</strong> Modul Kitab
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-4 border-t border-border flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => setPlottingMadin(item)}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold transition-colors cursor-pointer"
                                    >
                                        <Users className="w-3.5 h-3.5" />
                                        <span>Santri ({item.santri_count || 0})</span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openEditModal(item)}
                                            title="Edit Kelas"
                                            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMadin(item)}
                                            title="Hapus Kelas"
                                            className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── MODAL: TAMBAH / EDIT KELAS MADIN ── */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl p-6 sm:p-8 relative">
                        <button
                            onClick={() => setIsFormModalOpen(false)}
                            className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-foreground">
                                    {editingMadin ? 'Edit Kelas Madin' : 'Tambah Kelas Madin'}
                                </h3>
                                <p className="text-xs text-muted-foreground">Kelas Madrasah Diniyah kajian kitab</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitMadin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">Nama Kelas *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Madin Ula 1, Madin Wustho 2, Madin Ulya"
                                    value={formData.nama_kelas}
                                    onChange={(e) => setFormData({ ...formData, nama_kelas: e.target.value })}
                                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1.5">Tingkatan *</label>
                                    <select
                                        value={formData.tingkat}
                                        onChange={(e) => setFormData({ ...formData, tingkat: e.target.value as any })}
                                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="Ula">Ula (Tingkat Dasar)</option>
                                        <option value="Wustho">Wustho (Tingkat Menengah)</option>
                                        <option value="Ulya">Ulya (Tingkat Lanjutan)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1.5">Ustadz Wali Kelas</label>
                                    <select
                                        value={formData.wali_kelas_id}
                                        onChange={(e) => setFormData({ ...formData, wali_kelas_id: e.target.value })}
                                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">-- Pilih Ustadz --</option>
                                        {walis.map((w) => (
                                            <option key={w.id} value={w.id}>
                                                {w.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">Deskripsi / Target Pembelajaran</label>
                                <textarea
                                    rows={2}
                                    placeholder="Target kitab (Jurumiyyah, Safinah, Taqrib, dll.)..."
                                    value={formData.deskripsi}
                                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                                    className="w-full px-4 py-2 text-sm rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted text-sm font-semibold transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Menyimpan...' : editingMadin ? 'Simpan Perubahan' : 'Tambah Kelas'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL: KELOLA SANTRI DI KELAS MADIN ── */}
            {plottingMadin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-2xl rounded-3xl border border-border shadow-2xl p-6 sm:p-8 relative max-h-[90vh] flex flex-col">
                        <button
                            onClick={() => setPlottingMadin(null)}
                            className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-6 shrink-0">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-foreground">
                                    Santri: {plottingMadin.nama_kelas}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Tingkat {plottingMadin.tingkat} • Total santri terdaftar:{' '}
                                    <span className="font-bold text-foreground">
                                        {plottingMadin.santri?.length || 0} Santri
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Form Tambah Santri ke Kelas Madin */}
                        <form onSubmit={handleAssignSantri} className="p-4 rounded-2xl bg-muted/40 border border-border/80 mb-6 shrink-0">
                            <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                                <UserPlus className="w-4 h-4 text-purple-600" />
                                Masukkan Santri ke Kelas Madin Ini:
                            </p>
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedSantriId}
                                    onChange={(e) => setSelectedSantriId(e.target.value)}
                                    className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">-- Pilih Santri --</option>
                                    {unassignedSantri.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.email})
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    disabled={!selectedSantriId || plottingLoading}
                                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {plottingLoading ? '...' : 'Masukkan'}
                                </button>
                            </div>
                        </form>

                        {/* List Santri Saat Ini */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                Daftar Santri di Kelas Ini ({plottingMadin.santri?.length || 0})
                            </p>

                            {!plottingMadin.santri || plottingMadin.santri.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    Belum ada santri yang dimasukkan ke kelas Madin ini.
                                </div>
                            ) : (
                                plottingMadin.santri.map((s, idx) => (
                                    <div
                                        key={s.id}
                                        className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-foreground">{s.name}</p>
                                                <p className="text-xs text-muted-foreground">{s.email}</p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSantri(s.id)}
                                            disabled={plottingLoading}
                                            title="Keluarkan dari kelas ini"
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors cursor-pointer"
                                        >
                                            <UserMinus className="w-3.5 h-3.5" />
                                            <span>Keluarkan</span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
