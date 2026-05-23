import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Plus, Edit2, Trash2, School, X, Loader2, GraduationCap, MapPin, Layers } from 'lucide-react';

interface Jenjang {
    id: number;
    nama: string;
}

interface Rombel {
    id: number;
    name: string;
    lokasi: string | null;
    jenjang_id: number | null;
    jenjang: Jenjang | null;
    users_count?: number;
}

interface IndexProps {
    rombels: Rombel[];
    jenjang: Jenjang[];
}

const inputCls = 'w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition text-sm';

export default function Index({ rombels, jenjang }: IndexProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editRombel, setEditRombel] = useState<Rombel | null>(null);

    const { data, setData, post, put, delete: destroy, errors, reset, processing } = useForm({
        name: '',
        lokasi: '',
        jenjang_id: '',
    });

    const handleOpenAddModal = () => { reset(); setIsAddModalOpen(true); };
    const handleOpenEditModal = (r: Rombel) => { 
        setEditRombel(r); 
        setData({ 
            name: r.name, 
            lokasi: r.lokasi || '',
            jenjang_id: r.jenjang_id ? String(r.jenjang_id) : '',
        }); 
    };
    const handleCloseModal = () => { setIsAddModalOpen(false); setEditRombel(null); reset(); };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editRombel) {
            put(route('admin.rombels.update', editRombel.id), { onSuccess: () => handleCloseModal() });
        } else {
            post(route('admin.rombels.store'), { onSuccess: () => handleCloseModal() });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Hapus kelas ini? Semua murid di kelas ini akan terpengaruh.'))
            destroy(route('admin.rombels.destroy', id));
    };

    // Group rombels by jenjang
    const grouped = rombels.reduce<Record<string, { jenjang: Jenjang | {id: 0, nama: 'Tanpa Jenjang'}, items: Rombel[] }>>((acc, rombel) => {
        const j = rombel.jenjang || { id: 0, nama: 'Tanpa Jenjang' };
        const key = String(j.id);
        if (!acc[key]) acc[key] = { jenjang: j, items: [] };
        acc[key].items.push(rombel);
        return acc;
    }, {});

    return (
        <AppLayout breadcrumbs={[{ title: 'Data Kelas', href: '/admin/rombels' }]}>
            <Head title="Manajemen Kelas" />

            <div className="p-6 lg:p-8 max-w-screen-xl mx-auto">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-200">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Data Kelas</h1>
                            <p className="text-sm text-muted-foreground">{rombels.length} kelas terdaftar</p>
                        </div>
                    </div>
                    <button
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all font-semibold shadow-md shadow-emerald-200"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Kelas
                    </button>
                </div>

                {/* ── Empty State ── */}
                {rombels.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-card border-2 border-dashed border-border rounded-2xl">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-5">
                            <School className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">Belum ada kelas</h3>
                        <p className="text-muted-foreground text-sm mb-5 max-w-sm">Tambahkan kelas pertama untuk mulai mengorganisir murid.</p>
                        <button onClick={handleOpenAddModal} className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 font-semibold">
                            <Plus className="w-4 h-4" /> Tambah Kelas
                        </button>
                    </div>
                )}

                {/* ── Grouped by Jenjang ── */}
                <div className="space-y-10">
                    {Object.values(grouped).sort((a, b) => a.jenjang.nama.localeCompare(b.jenjang.nama)).map(({ jenjang: j, items }) => (
                        <div key={j.id}>
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                </div>
                                <h2 className="text-lg font-bold text-foreground">{j.nama}</h2>
                                <span className="ml-1 text-xs bg-muted text-muted-foreground rounded-full px-2.5 py-1 font-medium">{items.length} kelas</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {items.map((rombel) => (
                                    <div key={rombel.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-emerald-200 transition-all group">
                                        <div className="flex items-start justify-between mb-3">
                                            <Link href={`/admin/rombels/${rombel.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                                                    <School className="w-5 h-5 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-foreground text-lg">{rombel.name}</h3>
                                                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5 hover:underline">{rombel.users_count || 0} Murid (Lihat Detail)</p>
                                                </div>
                                            </Link>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenEditModal(rombel)} className="p-1.5 rounded-md text-muted-foreground hover:bg-blue-50 hover:text-blue-600" title="Edit">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => handleDelete(rombel.id)} className="p-1.5 rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600" title="Hapus">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        {rombel.lokasi && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span className="truncate">{rombel.lokasi}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Modal ── */}
            {(isAddModalOpen || editRombel) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-bold text-foreground">
                                {editRombel ? 'Edit Kelas' : 'Tambah Kelas Baru'}
                            </h2>
                            <button onClick={handleCloseModal} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Pilih Jenjang <span className="text-muted-foreground font-normal">(Opsional)</span></label>
                                <select value={data.jenjang_id} onChange={e => setData('jenjang_id', e.target.value)} className={inputCls}>
                                    <option value="">-- Tanpa Jenjang --</option>
                                    {jenjang.map(j => <option key={j.id} value={j.id}>{j.nama}</option>)}
                                </select>
                                {errors.jenjang_id && <p className="text-red-500 text-xs mt-1">{errors.jenjang_id}</p>}
                                {jenjang.length === 0 && (
                                    <p className="text-amber-500 text-xs mt-1">Anda belum membuat jenjang. Silakan buat jenjang terlebih dahulu di menu Data Jenjang.</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Nama Kelas</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className={inputCls}
                                    placeholder="Contoh: X 1, XI IPA 2"
                                    required
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Lokasi <span className="text-muted-foreground font-normal">(Opsional)</span></label>
                                <input
                                    type="text"
                                    value={data.lokasi}
                                    onChange={e => setData('lokasi', e.target.value)}
                                    className={inputCls}
                                    placeholder="Contoh: Gedung B, Ruang 102"
                                />
                                {errors.lokasi && <p className="text-red-500 text-xs mt-1">{errors.lokasi}</p>}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 border border-border rounded-xl hover:bg-muted text-sm font-medium transition-colors">
                                    Batal
                                </button>
                                <button type="submit" disabled={processing} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 text-sm font-semibold transition-colors">
                                    {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
