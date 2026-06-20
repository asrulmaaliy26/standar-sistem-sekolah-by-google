import React, { useState, useRef } from 'react'
import { Head, router, usePage, useForm } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import {
    FolderArchive,
    Upload,
    Trash2,
    File,
    Download,
    Plus,
    X,
    Check,
    AlertCircle,
    FileText,
    Image as ImageIcon,
    FileArchive,
    FileAudio,
    FileVideo,
    FileCode,
    Filter,
    Pencil
} from 'lucide-react'

// --- Interfaces ---

interface Kategori {
    id: number
    name: string
    slug: string
    color: string
    description: string | null
    files_count?: number
}

interface ArsipFile {
    id: number
    display_name: string
    original_name: string
    mime_type: string
    size: string
    drive_file_url: string
    drive_file_id: string
    description: string | null
    path: string | null
    kategori: {
        id: number
        name: string
        color: string
        slug: string
    } | null
    uploader: string
    uploader_id: number
    is_owner: boolean
    created_at: string
}

interface ArsipIndexProps {
    files: ArsipFile[]
    kategoriList: Kategori[]
    hasDriveAccess: boolean
    availableYears: number[]
    rombels: {id: number, name: string}[]
    activeKategori: string | null
    activeTahun: string | null
    activeBulan: string | null
    activeKelas: string | null
    canManageKategori: boolean
    driveOwnerEmail?: string | null
    flash?: { success?: string; error?: string }
}

// --- Helper Functions ---

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="size-8 text-blue-500" />
    if (mimeType.startsWith('video/')) return <FileVideo className="size-8 text-purple-500" />
    if (mimeType.startsWith('audio/')) return <FileAudio className="size-8 text-yellow-500" />
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('compressed')) return <FileArchive className="size-8 text-red-500" />
    if (mimeType.includes('pdf')) return <FileText className="size-8 text-red-600" />
    if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html') || mimeType.includes('css')) return <FileCode className="size-8 text-gray-500" />
    return <File className="size-8 text-gray-400" />
}

// --- Components ---

function UploadModal({
    kategoriList,
    onClose,
}: {
    kategoriList: Kategori[]
    onClose: () => void
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        arsip_kategori_id: kategoriList.length > 0 ? kategoriList[0].id : '',
        file: null as File | null,
        display_name: '',
        path: '',
        description: '',
    })

    const { props } = usePage<any>()
    const isAdmin = props.auth.user.is_admin

    const fileInputRef = useRef<HTMLInputElement>(null)

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        post(route('arsip.upload'), {
            onSuccess: () => {
                reset()
                onClose()
            },
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Upload className="size-5" />
                        Upload Arsip Baru
                    </h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={submit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Kategori</label>
                        <select
                            value={data.arsip_kategori_id}
                            onChange={(e) => setData('arsip_kategori_id', e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                            required
                        >
                            <option value="" disabled>-- Pilih Kategori --</option>
                            {kategoriList.map(k => (
                                <option key={k.id} value={k.id}>{k.name}</option>
                            ))}
                        </select>
                        {errors.arsip_kategori_id && <p className="text-xs text-destructive mt-1">{errors.arsip_kategori_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">File</label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => setData('file', e.target.files ? e.target.files[0] : null)}
                            className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                            required
                        />
                        {errors.file && <p className="text-xs text-destructive mt-1">{errors.file}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Nama Tampilan (Opsional)</label>
                        <input
                            type="text"
                            value={data.display_name}
                            onChange={(e) => setData('display_name', e.target.value)}
                            placeholder="Biarkan kosong untuk menggunakan nama file asli"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                        />
                        {errors.display_name && <p className="text-xs text-destructive mt-1">{errors.display_name}</p>}
                    </div>

                    {isAdmin && (
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Path / Folder Tambahan <span className="text-muted-foreground font-normal">(Khusus Admin)</span></label>
                            <input
                                type="text"
                                value={data.path}
                                onChange={(e) => setData('path', e.target.value)}
                                placeholder="Contoh: 2024/Januari"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                            />
                            {errors.path && <p className="text-xs text-destructive mt-1">{errors.path}</p>}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Deskripsi (Opsional)</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring resize-none"
                        ></textarea>
                        {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t border-border mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-md border border-border bg-card hover:bg-muted text-sm font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !data.file || !data.arsip_kategori_id}
                            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium disabled:opacity-50 transition-colors"
                        >
                            {processing ? 'Mengupload...' : 'Upload File'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function KategoriModal({
    kategori,
    onClose,
}: {
    kategori?: Kategori | null
    onClose: () => void
}) {
    const isEdit = !!kategori
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: kategori?.name || '',
        description: kategori?.description || '',
        color: kategori?.color || '#3B82F6',
    })

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isEdit) {
            put(route('arsip.kategori.update', kategori.id), {
                onSuccess: () => { reset(); onClose() }
            })
        } else {
            post(route('arsip.kategori.store'), {
                onSuccess: () => { reset(); onClose() }
            })
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <h2 className="text-lg font-semibold">{isEdit ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
                        <X className="size-5" />
                    </button>
                </div>
                <form onSubmit={submit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Nama Kategori</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                            required
                        />
                        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Warna Label</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={data.color}
                                onChange={(e) => setData('color', e.target.value)}
                                className="h-10 w-14 rounded border border-input bg-background p-1 cursor-pointer"
                            />
                            <span className="text-sm font-mono">{data.color}</span>
                        </div>
                        {errors.color && <p className="text-xs text-destructive mt-1">{errors.color}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Deskripsi</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring resize-none"
                        ></textarea>
                        {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
                    </div>
                    <div className="pt-4 flex justify-end gap-2 border-t border-border mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-border bg-card hover:bg-muted text-sm font-medium transition-colors">Batal</button>
                        <button type="submit" disabled={processing || !data.name} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium disabled:opacity-50 transition-colors">
                            {processing ? 'Menyimpan...' : 'Simpan Kategori'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// --- Main Page ---

export default function ArsipIndex({ files, kategoriList, availableYears, rombels, hasDriveAccess, driveOwnerEmail, activeKategori, activeTahun, activeBulan, activeKelas, canManageKategori }: ArsipIndexProps) {
    const { flash } = usePage().props as any
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [showKategoriModal, setShowKategoriModal] = useState(false)
    const [editingKategori, setEditingKategori] = useState<Kategori | null>(null)

    const BULAN_LIST = [
        { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maret' },
        { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
        { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' }, { value: '9', label: 'September' },
        { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
    ]

    const handleFilterChange = (params: { kategori?: string | null, tahun?: string | null, bulan?: string | null, kelas?: string | null }) => {
        const currentParams = new URLSearchParams(window.location.search)
        
        if (params.kategori !== undefined) {
            if (params.kategori) currentParams.set('kategori', params.kategori)
            else currentParams.delete('kategori')
        }
        
        if (params.tahun !== undefined) {
            if (params.tahun) currentParams.set('tahun', params.tahun)
            else currentParams.delete('tahun')
        }
        
        if (params.bulan !== undefined) {
            if (params.bulan) currentParams.set('bulan', params.bulan)
            else currentParams.delete('bulan')
        }

        if (params.kelas !== undefined) {
            if (params.kelas) currentParams.set('kelas', params.kelas)
            else currentParams.delete('kelas')
        }

        router.get(`${route('arsip.index')}?${currentParams.toString()}`)
    }

    const handleDeleteFile = (id: number) => {
        if (confirm('Yakin ingin menghapus file ini? File akan dihapus dari sistem dan Google Drive.')) {
            router.delete(route('arsip.destroy', id), { preserveScroll: true })
        }
    }

    const handleDeleteKategori = (id: number) => {
        if (confirm('Yakin ingin menghapus kategori ini?')) {
            router.delete(route('arsip.kategori.destroy', id), { preserveScroll: true })
        }
    }

    return (
        <AppLayout breadcrumbs={[
            { title: 'Pengarsipan', href: '/arsip' }
        ]}>
            <Head title="Pengarsipan" />

            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <FolderArchive className="size-6 text-primary" />
                            Sistem Pengarsipan
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                            <span>Kelola dan temukan dokumen arsip yang terhubung dengan Google Drive.</span>
                            {hasDriveAccess && driveOwnerEmail && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                    <Check className="size-3 mr-1" /> Drive Tersambung: {driveOwnerEmail}
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {canManageKategori && (
                            <button
                                onClick={() => { setEditingKategori(null); setShowKategoriModal(true); }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-medium transition-colors"
                            >
                                <Plus className="size-4" /> Kelola Kategori
                            </button>
                        )}
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
                        >
                            <Upload className="size-4" /> Upload File
                        </button>
                    </div>
                </div>

                {flash?.success && (
                    <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-800 dark:text-green-400">
                        <Check className="size-4 shrink-0" /> {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-400">
                        <AlertCircle className="size-4 shrink-0" /> {flash.error}
                    </div>
                )}

                {!hasDriveAccess && (
                    <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
                        <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">Sistem Google Drive Belum Dikonfigurasi</h3>
                            {usePage().props.auth.user.is_admin ? (
                                <>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1 mb-3">
                                        Untuk mengupload file arsip, sistem memerlukan satu akun Google Drive terpusat. 
                                        Silakan login menggunakan akun Google Anda (Admin) untuk mengaktifkan integrasi Drive.
                                    </p>
                                    <a 
                                        href={route('auth.google.redirect') + "?with_drive=1"} 
                                        className="inline-flex items-center px-3 py-1.5 rounded-md bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-800/40 dark:text-yellow-300 dark:hover:bg-yellow-800/60 text-xs font-medium transition-colors"
                                    >
                                        Hubungkan Google Drive Sistem
                                    </a>
                                </>
                            ) : (
                                <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">
                                    Admin sistem belum mengkonfigurasi integrasi Google Drive. Anda tidak dapat mengupload file saat ini. Silakan hubungi Admin.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Sidebar Kategori */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Filter className="size-4" /> Kategori
                            </h3>
                            <div className="space-y-1">
                                <button
                                    onClick={() => handleFilterChange({ kategori: null })}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!activeKategori ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                                >
                                    Semua Kategori
                                </button>
                                {kategoriList.map(k => (
                                    <div key={k.id} className={`group flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors ${activeKategori === k.slug ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
                                        <button
                                            onClick={() => handleFilterChange({ kategori: k.slug })}
                                            className="flex items-center gap-2 flex-1 text-left truncate"
                                        >
                                            <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: k.color }}></span>
                                            <span className="truncate">{k.name}</span>
                                            <span className="ml-auto text-xs opacity-60">({k.files_count || 0})</span>
                                        </button>
                                        
                                        {canManageKategori && (
                                            <div className="hidden group-hover:flex items-center ml-2 shrink-0">
                                                <button onClick={() => { setEditingKategori(k); setShowKategoriModal(true); }} className="p-1 hover:bg-background rounded text-muted-foreground hover:text-primary"><Pencil className="size-3" /></button>
                                                <button onClick={() => handleDeleteKategori(k.id)} className="p-1 hover:bg-background rounded text-muted-foreground hover:text-destructive" disabled={(k.files_count || 0) > 0} title={(k.files_count || 0) > 0 ? "Tidak bisa hapus kategori yang memiliki file" : "Hapus"}><Trash2 className="size-3" /></button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {kategoriList.length === 0 && (
                                    <p className="text-xs text-muted-foreground px-3 py-2 italic">Belum ada kategori.</p>
                                )}
                            </div>
                        </div>

                        {/* Filter Waktu */}
                        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                            <h3 className="text-sm font-semibold mb-3">Filter Waktu</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Tahun</label>
                                    <select 
                                        value={activeTahun || ''} 
                                        onChange={(e) => handleFilterChange({ tahun: e.target.value })}
                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">Semua Tahun</option>
                                        {availableYears.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Bulan</label>
                                    <select 
                                        value={activeBulan || ''} 
                                        onChange={(e) => handleFilterChange({ bulan: e.target.value })}
                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">Semua Bulan</option>
                                        {BULAN_LIST.map(bulan => (
                                            <option key={bulan.value} value={bulan.value}>{bulan.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Kelas</label>
                                    <select 
                                        value={activeKelas || ''} 
                                        onChange={(e) => handleFilterChange({ kelas: e.target.value })}
                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">Semua Kelas</option>
                                        {rombels.map(rombel => (
                                            <option key={rombel.id} value={rombel.id}>{rombel.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Files List */}
                    <div className="md:col-span-3">
                        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                            {files.length === 0 ? (
                                <div className="p-12 flex flex-col items-center justify-center text-center">
                                    <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <FolderArchive className="size-8 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Tidak Ada File</h3>
                                    <p className="text-muted-foreground text-sm max-w-sm mt-1 mb-6">
                                        {activeKategori 
                                            ? "Belum ada file yang diupload ke kategori ini." 
                                            : "Sistem pengarsipan masih kosong. Mulai dengan mengupload file pertama Anda."}
                                    </p>
                                    <button
                                        onClick={() => setShowUploadModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
                                    >
                                        <Upload className="size-4" /> Upload File Sekarang
                                    </button>
                                </div>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {files.map(file => (
                                        <li key={file.id} className="p-4 hover:bg-muted/30 transition-colors group flex flex-col sm:flex-row sm:items-center gap-4">
                                            <div className="shrink-0 p-2 bg-background rounded-lg border border-border">
                                                {getFileIcon(file.mime_type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-semibold text-foreground truncate" title={file.display_name}>
                                                        {file.display_name}
                                                    </h4>
                                                    {file.kategori && (
                                                        <span 
                                                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider" 
                                                            style={{ backgroundColor: `${file.kategori.color}20`, color: file.kategori.color }}
                                                        >
                                                            {file.kategori.name}
                                                        </span>
                                                    )}
                                                    {file.path && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium tracking-wider bg-secondary text-secondary-foreground">
                                                            /{file.path}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                    <span>{file.size}</span>
                                                    <span>•</span>
                                                    <span>{file.created_at}</span>
                                                    <span>•</span>
                                                    <span className="truncate">Oleh {file.uploader}</span>
                                                </div>
                                                {file.description && (
                                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{file.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a
                                                    href={file.drive_file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                                    title="Buka di Google Drive"
                                                >
                                                    <Download className="size-4" />
                                                </a>
                                                {file.is_owner && (
                                                    <button
                                                        onClick={() => handleDeleteFile(file.id)}
                                                        className="p-2 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showUploadModal && <UploadModal kategoriList={kategoriList} onClose={() => setShowUploadModal(false)} />}
            {showKategoriModal && <KategoriModal kategori={editingKategori} onClose={() => { setShowKategoriModal(false); setEditingKategori(null); }} />}

        </AppLayout>
    )
}
