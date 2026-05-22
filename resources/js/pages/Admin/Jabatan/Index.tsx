import React, { useState } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Pencil, Trash2, Plus, X, Check, Users, Briefcase, AlertCircle } from 'lucide-react'

interface JabatanItem {
    id: number
    name: string
    description: string | null
    users_count: number
    created_at: string
}

interface JabatanIndexProps {
    jabatan: JabatanItem[]
}

// ---------- Modal Form ----------
function JabatanForm({
    title,
    defaultValues,
    onClose,
    onSubmit,
    processing,
    errors,
}: {
    title: string
    defaultValues: { name: string; description: string }
    onClose: () => void
    onSubmit: (data: { name: string; description: string }) => void
    processing: boolean
    errors: Partial<Record<string, string>>
}) {
    const [values, setValues] = useState(defaultValues)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-2xl animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Nama Jabatan <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            value={values.name}
                            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                            placeholder="cth: wali kelas"
                            className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground text-sm
                                focus:outline-none focus:ring-2 focus:ring-ring transition-shadow
                                ${errors.name ? 'border-destructive' : 'border-input'}`}
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="size-3" /> {errors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Deskripsi
                        </label>
                        <textarea
                            value={values.description}
                            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
                            placeholder="Deskripsi singkat tentang jabatan ini…"
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm
                                focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-shadow"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={() => onSubmit(values)}
                        disabled={processing || !values.name.trim()}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {processing ? (
                            <svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                        ) : (
                            <Check className="size-4" />
                        )}
                        Simpan
                    </button>
                </div>
            </div>
        </div>
    )
}

// ---------- Delete Confirm ----------
function DeleteConfirm({
    jabatan,
    onClose,
    onConfirm,
    processing,
}: {
    jabatan: JabatanItem
    onClose: () => void
    onConfirm: () => void
    processing: boolean
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-sm mx-4 bg-card border border-border rounded-xl shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
                        <Trash2 className="size-6 text-destructive" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">Hapus Jabatan</h3>
                    <p className="text-sm text-muted-foreground mb-1">
                        Yakin ingin menghapus jabatan{' '}
                        <span className="font-semibold text-foreground capitalize">"{jabatan.name}"</span>?
                    </p>
                    {jabatan.users_count > 0 && (
                        <p className="text-xs text-destructive mt-2 bg-destructive/10 px-3 py-2 rounded-md">
                            ⚠ Masih digunakan oleh {jabatan.users_count} user — tidak bisa dihapus.
                        </p>
                    )}
                </div>
                <div className="flex gap-2 px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={processing || jabatan.users_count > 0}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                    >
                        {processing && (
                            <svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                        )}
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    )
}

// ---------- Main Page ----------
export default function JabatanIndex({ jabatan }: JabatanIndexProps) {
    const { flash } = usePage().props as any
    const [showCreate, setShowCreate] = useState(false)
    const [editTarget, setEditTarget] = useState<JabatanItem | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<JabatanItem | null>(null)
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})
    const [processing, setProcessing] = useState(false)

    const handleCreate = (values: { name: string; description: string }) => {
        setProcessing(true)
        router.post(route('admin.jabatan.store'), values, {
            preserveScroll: true,
            onSuccess: () => { setShowCreate(false); setFormErrors({}); setProcessing(false) },
            onError: (e) => { setFormErrors(e); setProcessing(false) },
        })
    }

    const handleUpdate = (values: { name: string; description: string }) => {
        if (!editTarget) return
        setProcessing(true)
        router.put(route('admin.jabatan.update', editTarget.id), values, {
            preserveScroll: true,
            onSuccess: () => { setEditTarget(null); setFormErrors({}); setProcessing(false) },
            onError: (e) => { setFormErrors(e); setProcessing(false) },
        })
    }

    const handleDelete = () => {
        if (!deleteTarget) return
        setProcessing(true)
        router.delete(route('admin.jabatan.destroy', deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => { setDeleteTarget(null); setProcessing(false) },
            onError: () => setProcessing(false),
        })
    }

    return (
        <AppLayout breadcrumbs={[
            { title: 'Admin', href: '/admin/dashboard' },
            { title: 'Manajemen Jabatan', href: '/admin/jabatan' },
        ]}>
            <Head title="Manajemen Jabatan" />

            <div className="p-6">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manajemen Jabatan</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kelola daftar jabatan yang dapat ditetapkan ke user.
                        </p>
                    </div>
                    <button
                        onClick={() => { setFormErrors({}); setShowCreate(true) }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
                    >
                        <Plus className="size-4" />
                        Tambah Jabatan
                    </button>
                </div>

                {/* Flash messages */}
                {flash?.success && (
                    <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-800 dark:text-green-400">
                        <Check className="size-4 shrink-0" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-400">
                        <AlertCircle className="size-4 shrink-0" />
                        {flash.error}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Briefcase className="size-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{jabatan.length}</p>
                            <p className="text-xs text-muted-foreground">Total Jabatan</p>
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Users className="size-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {jabatan.reduce((sum, j) => sum + j.users_count, 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">User Ber-jabatan</p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                {jabatan.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-dashed border-border rounded-xl">
                        <div className="p-4 bg-muted rounded-full mb-4">
                            <Briefcase className="size-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-base font-semibold">Belum ada jabatan</h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">
                            Mulai dengan menambahkan jabatan pertama.
                        </p>
                        <button
                            onClick={() => { setFormErrors({}); setShowCreate(true) }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="size-4" />
                            Tambah Jabatan
                        </button>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-8">
                                        #
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Nama Jabatan
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Deskripsi
                                    </th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Jumlah User
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Dibuat
                                    </th>
                                    <th className="px-3 py-3 pr-6 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {jabatan.map((j, idx) => (
                                    <tr key={j.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="py-3.5 pl-6 pr-3 text-sm text-muted-foreground">
                                            {idx + 1}
                                        </td>
                                        <td className="px-3 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-1.5 bg-blue-500/10 rounded-md">
                                                    <Briefcase className="size-3.5 text-blue-500" />
                                                </div>
                                                <span className="text-sm font-medium text-foreground capitalize">
                                                    {j.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3.5 text-sm text-muted-foreground max-w-xs">
                                            {j.description ?? (
                                                <span className="italic opacity-50">—</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3.5 text-center">
                                            <span className={`inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${j.users_count > 0
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                    : 'bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                <Users className="size-3" />
                                                {j.users_count}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3.5 text-sm text-muted-foreground">
                                            {j.created_at}
                                        </td>
                                        <td className="px-3 py-3.5 pr-6">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setFormErrors({}); setEditTarget(j) }}
                                                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(j)}
                                                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreate && (
                <JabatanForm
                    title="Tambah Jabatan Baru"
                    defaultValues={{ name: '', description: '' }}
                    onClose={() => setShowCreate(false)}
                    onSubmit={handleCreate}
                    processing={processing}
                    errors={formErrors}
                />
            )}
            {editTarget && (
                <JabatanForm
                    title="Edit Jabatan"
                    defaultValues={{ name: editTarget.name, description: editTarget.description ?? '' }}
                    onClose={() => setEditTarget(null)}
                    onSubmit={handleUpdate}
                    processing={processing}
                    errors={formErrors}
                />
            )}
            {deleteTarget && (
                <DeleteConfirm
                    jabatan={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                    processing={processing}
                />
            )}
        </AppLayout>
    )
}
