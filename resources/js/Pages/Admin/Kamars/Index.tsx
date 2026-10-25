import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Home,
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
    Building2,
    ShieldAlert,
    Sparkles,
    ClipboardCheck,
} from 'lucide-react';

interface Pembina {
    id: number;
    name: string;
    email: string;
}

interface Santri {
    id: number;
    name: string;
    email: string;
    kamar_id?: number | null;
    jenis_kelamin?: 'L' | 'P' | null;
}

interface KamarItem {
    id: number;
    nama_kamar: string;
    gedung: string | null;
    kapasitas: number;
    gender: 'L' | 'P';
    pembina_id: number | null;
    pembina: Pembina | null;
    keterangan: string | null;
    santri: Santri[];
    santri_count: number;
}

interface Props {
    kamars: KamarItem[];
    pembinas: Pembina[];
    availableSantri: Santri[];
}

export default function KamarIndex({ kamars = [], pembinas = [], availableSantri = [] }: Props) {
    const [search, setSearch] = useState('');
    const [genderFilter, setGenderFilter] = useState<'ALL' | 'L' | 'P'>('ALL');

    // Modal state untuk Tambah / Edit Kamar
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingKamar, setEditingKamar] = useState<KamarItem | null>(null);
    const [formData, setFormData] = useState({
        nama_kamar: '',
        gedung: '',
        kapasitas: 10,
        gender: 'L' as 'L' | 'P',
        pembina_id: '' as string | number,
        keterangan: '',
    });
    const [submitting, setSubmitting] = useState(false);

    // Modal state untuk Kelola Penghuni (Plotting Santri)
    const [plottingKamar, setPlottingKamar] = useState<KamarItem | null>(null);
    const [selectedSantriId, setSelectedSantriId] = useState('');
    const [plottingLoading, setPlottingLoading] = useState(false);

    // Filter kamar
    const filteredKamars = kamars.filter((k) => {
        const matchSearch =
            k.nama_kamar.toLowerCase().includes(search.toLowerCase()) ||
            (k.gedung && k.gedung.toLowerCase().includes(search.toLowerCase())) ||
            (k.pembina && k.pembina.name.toLowerCase().includes(search.toLowerCase()));
        const matchGender = genderFilter === 'ALL' || k.gender === genderFilter;
        return matchSearch && matchGender;
    });

    // Statistik
    const totalKamar = kamars.length;
    const totalSantri = kamars.reduce((acc, k) => acc + (k.santri_count || 0), 0);
    const kamarPutra = kamars.filter((k) => k.gender === 'L').length;
    const kamarPutri = kamars.filter((k) => k.gender === 'P').length;

    // Buka modal create
    const openCreateModal = () => {
        setEditingKamar(null);
        setFormData({
            nama_kamar: '',
            gedung: '',
            kapasitas: 10,
            gender: 'L',
            pembina_id: '',
            keterangan: '',
        });
        setIsFormModalOpen(true);
    };

    // Buka modal edit
    const openEditModal = (kamar: KamarItem) => {
        setEditingKamar(kamar);
        setFormData({
            nama_kamar: kamar.nama_kamar,
            gedung: kamar.gedung || '',
            kapasitas: kamar.kapasitas,
            gender: kamar.gender,
            pembina_id: kamar.pembina_id || '',
            keterangan: kamar.keterangan || '',
        });
        setIsFormModalOpen(true);
    };

    // Submit form kamar
    const handleSubmitKamar = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            ...formData,
            pembina_id: formData.pembina_id ? Number(formData.pembina_id) : null,
        };

        if (editingKamar) {
            router.put(route('admin.kamars.update', editingKamar.id), payload, {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    setSubmitting(false);
                },
                onError: () => setSubmitting(false),
            });
        } else {
            router.post(route('admin.kamars.store'), payload, {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    setSubmitting(false);
                },
                onError: () => setSubmitting(false),
            });
        }
    };

    // Hapus kamar
    const handleDeleteKamar = (kamar: KamarItem) => {
        if (!confirm(`Hapus kamar "${kamar.nama_kamar}"? Santri yang menempati akan dilepas dari kamar ini.`)) return;

        router.delete(route('admin.kamars.destroy', kamar.id));
    };

    // Tambah santri ke kamar
    const handleAssignSantri = (e: React.FormEvent) => {
        e.preventDefault();
        if (!plottingKamar || !selectedSantriId) return;

        setPlottingLoading(true);
        router.post(
            route('admin.kamars.assign-santri', plottingKamar.id),
            { user_id: selectedSantriId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedSantriId('');
                    setPlottingLoading(false);
                    // Refresh data kamar yang sedang dibuka
                    const updated = kamars.find((k) => k.id === plottingKamar.id);
                    if (updated) setPlottingKamar(updated);
                },
                onError: () => setPlottingLoading(false),
            }
        );
    };

    // Keluarkan santri dari kamar
    const handleRemoveSantri = (santriId: number) => {
        if (!plottingKamar) return;

        setPlottingLoading(true);
        router.post(
            route('admin.kamars.remove-santri', plottingKamar.id),
            { user_id: santriId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setPlottingLoading(false);
                    const updated = kamars.find((k) => k.id === plottingKamar.id);
                    if (updated) setPlottingKamar(updated);
                },
                onError: () => setPlottingLoading(false),
            }
        );
    };

    // Santri yang belum punya kamar (atau berstatus gender sesuai kamar plotting)
    const filteredAvailableSantri = availableSantri.filter((s) => {
        if (s.kamar_id) return false; // Sudah punya kamar
        if (!plottingKamar) return true;
        if (s.jenis_kelamin && s.jenis_kelamin !== plottingKamar.gender) return false;
        return true;
    });

    return (
        <AppLayout breadcrumbs={[{ title: 'Panel Admin', href: '/admin/dashboard' }, { title: 'Data Kamar Pondok', href: '/admin/kamars' }]}>
            <Head title="Data Kamar Pondok" />

            <div className="p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto space-y-8">
                {/* ── Banner Header ── */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 p-8 text-white shadow-xl">
                    <div className="absolute -top-12 -right-12 w-56 h-56 bg-emerald-400/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-8 left-12 w-44 h-44 bg-teal-400/10 rounded-full blur-2xl" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-3">
                                <Home className="w-3.5 h-3.5" />
                                <span>Pilar Pondok Pesantren</span>
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight">Kamar & Asrama Santri</h1>
                            <p className="text-emerald-100/80 text-sm mt-1 max-w-xl">
                                Kelola data kamar pondok, kapasitas daya tampung, ustadz pembina, dan penempatan (plotting) santri putra/putri.
                            </p>
                        </div>

                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all self-start md:self-auto cursor-pointer"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Tambah Kamar</span>
                        </button>
                    </div>
                </div>

                {/* ── Ringkasan Statistik ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Total Kamar</span>
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                                <Home className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2">{totalKamar}</p>
                        <p className="text-xs text-muted-foreground mt-1">Kamar aktif terdaftar</p>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Santri Mukim</span>
                            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2">{totalSantri}</p>
                        <p className="text-xs text-muted-foreground mt-1">Santri menempati kamar</p>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Kamar Putra</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                L
                            </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-2">{kamarPutra}</p>
                        <p className="text-xs text-muted-foreground mt-1">Asrama santri putra</p>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Kamar Putri</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                                P
                            </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-2">{kamarPutri}</p>
                        <p className="text-xs text-muted-foreground mt-1">Asrama santri putri</p>
                    </div>
                </div>

                {/* ── Filter & Search Bar ── */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari kamar, gedung, pembina..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">Kategori:</span>
                        <div className="inline-flex rounded-xl border border-border p-1 bg-muted/40">
                            <button
                                onClick={() => setGenderFilter('ALL')}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                                    genderFilter === 'ALL' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Semua
                            </button>
                            <button
                                onClick={() => setGenderFilter('L')}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                                    genderFilter === 'L' ? 'bg-blue-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Putra (L)
                            </button>
                            <button
                                onClick={() => setGenderFilter('P')}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                                    genderFilter === 'P' ? 'bg-rose-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Putri (P)
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Grid Kamar ── */}
                {filteredKamars.length === 0 ? (
                    <div className="text-center py-16 bg-card border border-dashed border-border rounded-3xl p-8">
                        <Home className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <h3 className="text-lg font-bold text-foreground">Tidak Ada Kamar Ditemukan</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                            {kamars.length === 0
                                ? 'Belum ada data kamar pondok. Klik tombol Tambah Kamar di atas untuk memulai.'
                                : 'Tidak ada kamar yang sesuai dengan filter pencarian Anda.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredKamars.map((kamar) => {
                            const isPutra = kamar.gender === 'L';
                            const terisi = kamar.santri_count || 0;
                            const persen = Math.min(100, Math.round((terisi / kamar.kapasitas) * 100));
                            const isPenuh = terisi >= kamar.kapasitas;

                            return (
                                <div
                                    key={kamar.id}
                                    className="group relative bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        {/* Header Card */}
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${
                                                        isPutra
                                                            ? 'bg-blue-500/10 text-blue-600 border border-blue-200 dark:border-blue-800'
                                                            : 'bg-rose-500/10 text-rose-600 border border-rose-200 dark:border-rose-800'
                                                    }`}
                                                >
                                                    <Home className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-extrabold text-lg text-foreground group-hover:text-emerald-600 transition-colors">
                                                        {kamar.nama_kamar}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <Building2 className="w-3.5 h-3.5" />
                                                        {kamar.gedung || 'Asrama Utama'}
                                                    </p>
                                                </div>
                                            </div>

                                            <span
                                                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                                    isPutra
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                                        : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                                }`}
                                            >
                                                {isPutra ? 'Putra' : 'Putri'}
                                            </span>
                                        </div>

                                        {/* Kapasitas Progress */}
                                        <div className="space-y-1.5 mb-4">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-muted-foreground">Kapasitas Penghuni</span>
                                                <span className={`font-bold ${isPenuh ? 'text-rose-600' : 'text-foreground'}`}>
                                                    {terisi} / {kamar.kapasitas} Santri {isPenuh && '(Penuh)'}
                                                </span>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        isPenuh
                                                            ? 'bg-rose-500'
                                                            : persen > 70
                                                            ? 'bg-amber-500'
                                                            : 'bg-emerald-500'
                                                    }`}
                                                    style={{ width: `${persen}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Pembina Kamar */}
                                        <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-1 mb-4">
                                            <span className="text-muted-foreground font-medium">Ustadz / Pembina:</span>
                                            <p className="font-bold text-foreground flex items-center gap-1.5">
                                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                {kamar.pembina ? kamar.pembina.name : <span className="text-muted-foreground italic">Belum ditentukan</span>}
                                            </p>
                                        </div>

                                        {kamar.keterangan && (
                                            <p className="text-xs text-muted-foreground italic line-clamp-2 mb-4">
                                                "{kamar.keterangan}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-4 border-t border-border flex items-center justify-between gap-2">
                                        <button
                                            onClick={() => setPlottingKamar(kamar)}
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold transition-colors cursor-pointer"
                                        >
                                            <Users className="w-3.5 h-3.5" />
                                            <span>Penghuni ({terisi})</span>
                                        </button>

                                        <Link
                                            href={route('admin.pondok.input-kamar', { kamar_id: kamar.id })}
                                            className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
                                            title="Buka Sesi Input Setoran Kamar Ini"
                                        >
                                            <ClipboardCheck className="w-3.5 h-3.5" />
                                            <span>Setoran</span>
                                        </Link>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEditModal(kamar)}
                                                title="Edit Kamar"
                                                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteKamar(kamar)}
                                                title="Hapus Kamar"
                                                className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── MODAL: TAMBAH / EDIT KAMAR ── */}
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
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                <Home className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-foreground">
                                    {editingKamar ? 'Edit Data Kamar' : 'Tambah Kamar Baru'}
                                </h3>
                                <p className="text-xs text-muted-foreground">Kamar pondok santri asrama</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitKamar} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">Nama Kamar *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Abu Bakar 01, Khadijah Putri A"
                                    value={formData.nama_kamar}
                                    onChange={(e) => setFormData({ ...formData, nama_kamar: e.target.value })}
                                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1.5">Gedung / Asrama</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Asrama Putra Lt. 2"
                                        value={formData.gedung}
                                        onChange={(e) => setFormData({ ...formData, gedung: e.target.value })}
                                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1.5">Kapasitas (Orang) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="100"
                                        value={formData.kapasitas}
                                        onChange={(e) => setFormData({ ...formData, kapasitas: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1.5">Khusus Santri *</label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="L">Putra (Laki-laki)</option>
                                        <option value="P">Putri (Perempuan)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1.5">Ustadz Pembina</label>
                                    <select
                                        value={formData.pembina_id}
                                        onChange={(e) => setFormData({ ...formData, pembina_id: e.target.value })}
                                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">-- Pilih Pembina --</option>
                                        {pembinas.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">Keterangan / Fasilitas</label>
                                <textarea
                                    rows={2}
                                    placeholder="Catatan fasilitas kamar atau aturan..."
                                    value={formData.keterangan}
                                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                    className="w-full px-4 py-2 text-sm rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Menyimpan...' : editingKamar ? 'Simpan Perubahan' : 'Tambah Kamar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL: KELOLA PENGHUNI KAMAR (PLOTTING SANTRI) ── */}
            {plottingKamar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-2xl rounded-3xl border border-border shadow-2xl p-6 sm:p-8 relative max-h-[90vh] flex flex-col">
                        <button
                            onClick={() => setPlottingKamar(null)}
                            className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-6 shrink-0">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-foreground">
                                    Penghuni: {plottingKamar.nama_kamar}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Khusus Santri {plottingKamar.gender === 'L' ? 'Putra' : 'Putri'} • Kapasitas:{' '}
                                    <span className="font-bold text-foreground">
                                        {plottingKamar.santri?.length || 0} / {plottingKamar.kapasitas}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Form Tambah Santri ke Kamar */}
                        {(plottingKamar.santri?.length || 0) < plottingKamar.kapasitas ? (
                            <form onSubmit={handleAssignSantri} className="p-4 rounded-2xl bg-muted/40 border border-border/80 mb-6 shrink-0">
                                <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                                    <UserPlus className="w-4 h-4 text-emerald-600" />
                                    Tempatkan Santri ke Kamar Ini:
                                </p>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedSantriId}
                                        onChange={(e) => setSelectedSantriId(e.target.value)}
                                        className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">-- Pilih Santri ({filteredAvailableSantri.length} santri belum punya kamar) --</option>
                                        {filteredAvailableSantri.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} ({s.email})
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="submit"
                                        disabled={!selectedSantriId || plottingLoading}
                                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        {plottingLoading ? '...' : 'Masukkan'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mb-6 flex items-center gap-2 shrink-0">
                                <ShieldAlert className="w-4 h-4 shrink-0" />
                                <span>Kamar sudah penuh. Keluarkan santri terlebih dahulu jika ingin menambahkan santri baru.</span>
                            </div>
                        )}

                        {/* List Santri Saat Ini */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                Daftar Santri di Kamar ({plottingKamar.santri?.length || 0})
                            </p>

                            {!plottingKamar.santri || plottingKamar.santri.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    Belum ada santri yang menempati kamar ini.
                                </div>
                            ) : (
                                plottingKamar.santri.map((s, idx) => (
                                    <div
                                        key={s.id}
                                        className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
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
                                            title="Keluarkan dari kamar"
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
