import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Plus, Edit2, Trash2, Layers, X, Loader2, MapPin } from 'lucide-react';

interface Jenjang {
    id: number;
    nama: string;
    lokasi: string | null;
    deskripsi: string | null;
    rombels_count?: number;
    users_count?: number;
}

interface IndexProps {
    jenjang: Jenjang[];
}

const inputCls = 'w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition';

export default function Index({ jenjang }: IndexProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editJenjang, setEditJenjang] = useState<Jenjang | null>(null);

    const { data, setData, post, put, delete: destroy, errors, reset, processing } = useForm({
        nama: '',
        lokasi: '',
        deskripsi: '',
    });

    const handleOpenAddModal = () => { reset(); setIsAddModalOpen(true); };
    const handleOpenEditModal = (j: Jenjang) => { 
        setEditJenjang(j); 
        setData({ 
            nama: j.nama, 
            lokasi: j.lokasi || '', 
            deskripsi: j.deskripsi || '' 
        }); 
    };
    const handleCloseModal = () => { setIsAddModalOpen(false); setEditJenjang(null); reset(); };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editJenjang) {
            put(route('admin.jenjang.update', editJenjang.id), { onSuccess: () => handleCloseModal() });
        } else {
            post(route('admin.jenjang.store'), { onSuccess: () => handleCloseModal() });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Hapus jenjang ini? Semua kelas yang terkait akan kehilangan referensi jenjangnya.')) {
            destroy(route('admin.jenjang.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Data Jenjang', href: '/admin/jenjang' }]}>
            <Head title="Manajemen Jenjang" />

            <div className="p-6 lg:p-8 max-w-screen-xl mx-auto">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                            <Layers className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Data Jenjang</h1>
                            <p className="text-sm text-muted-foreground">{jenjang.length} jenjang terdaftar</p>
                        </div>
                    </div>
                    <button
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all font-semibold shadow-md shadow-indigo-200"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Jenjang
                    </button>
                </div>

                {/* ── Grid/List ── */}
                {jenjang.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl shadow-sm text-center">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-5">
                            <Layers className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">Belum ada jenjang</h3>
                        <p className="text-muted-foreground text-sm mb-5 max-w-sm">Tambahkan jenjang pendidikan (misal: SD, SMP, SMA) untuk mengelompokkan kelas.</p>
                        <button onClick={handleOpenAddModal} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 font-semibold">
                            <Plus className="w-4 h-4" /> Tambah Jenjang
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jenjang.map((j) => (
                            <div key={j.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                                <div className="p-5 flex items-start justify-between border-b border-border/50 bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                                            <Layers className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground text-lg">{j.nama}</h3>
                                            <p className="text-xs font-medium text-muted-foreground">{j.rombels_count || 0} Kelas · {j.users_count || 0} Murid</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleOpenEditModal(j)} className="p-2 rounded-lg text-muted-foreground hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(j.id)} className="p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors" title="Hapus">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-5 space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="w-4 h-4" />
                                        <span>{j.lokasi || 'Lokasi belum diatur'}</span>
                                    </div>
                                    {j.deskripsi && (
                                        <div className="bg-muted/40 rounded-xl px-4 py-3 text-sm text-muted-foreground">
                                            {j.deskripsi}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            {(isAddModalOpen || editJenjang) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-bold text-foreground">
                                {editJenjang ? 'Edit Jenjang' : 'Tambah Jenjang Baru'}
                            </h2>
                            <button onClick={handleCloseModal} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Nama Jenjang</label>
                                <input
                                    type="text"
                                    value={data.nama}
                                    onChange={e => setData('nama', e.target.value)}
                                    className={inputCls}
                                    placeholder="Contoh: SD Negeri 1, SMP, SMA"
                                    autoFocus
                                    required
                                />
                                {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Lokasi <span className="text-muted-foreground font-normal">(Opsional)</span></label>
                                <input
                                    type="text"
                                    value={data.lokasi}
                                    onChange={e => setData('lokasi', e.target.value)}
                                    className={inputCls}
                                    placeholder="Contoh: Gedung A, Lantai 1, Jl. Raya No. 1"
                                />
                                {errors.lokasi && <p className="text-red-500 text-xs mt-1">{errors.lokasi}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Deskripsi <span className="text-muted-foreground font-normal">(Opsional)</span></label>
                                <textarea
                                    value={data.deskripsi}
                                    onChange={e => setData('deskripsi', e.target.value)}
                                    className={`${inputCls} min-h-[100px] resize-none`}
                                    placeholder="Keterangan tambahan mengenai jenjang ini..."
                                />
                                {errors.deskripsi && <p className="text-red-500 text-xs mt-1">{errors.deskripsi}</p>}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 border border-border rounded-xl hover:bg-muted text-sm font-medium transition-colors">
                                    Batal
                                </button>
                                <button type="submit" disabled={processing} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-sm font-semibold transition-colors">
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
