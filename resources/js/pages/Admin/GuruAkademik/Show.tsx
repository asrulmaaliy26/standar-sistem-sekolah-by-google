import React, { useState } from 'react'
import { Head, Link, useForm, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'

interface GuruProfile {
    id: number
    name: string
    email: string
    jabatan: string
    rombel_name: string | null
}

interface ClassroomLink {
    id: number
    mapel: string
    rombel_id: number
    rombel_name: string
    link: string
    keterangan: string | null
    created_at: string
}

interface Rombel {
    id: number
    name: string
}

interface GuruShowProps {
    guru: GuruProfile
    links: ClassroomLink[]
    rombels: Rombel[]
}

export default function GuruShow({ guru, links, rombels }: GuruShowProps) {
    const [isAddingLink, setIsAddingLink] = useState(false)
    const [editingLinkId, setEditingLinkId] = useState<number | null>(null)
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        mapel: '',
        rombel_id: '',
        link: '',
        keterangan: '',
    })

    const handleOpenForm = () => {
        setIsAddingLink(true)
        setEditingLinkId(null)
        reset()
        clearErrors()
    }

    const handleCloseForm = () => {
        setIsAddingLink(false)
        setEditingLinkId(null)
        reset()
        clearErrors()
    }

    const handleEditLink = (linkItem: ClassroomLink) => {
        setIsAddingLink(true)
        setEditingLinkId(linkItem.id)
        setData({
            mapel: linkItem.mapel,
            rombel_id: linkItem.rombel_id.toString(),
            link: linkItem.link,
            keterangan: linkItem.keterangan || '',
        })
        clearErrors()
    }

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault()
        if (editingLinkId) {
            put(route('admin.guru.update-link', editingLinkId), {
                onSuccess: () => handleCloseForm(),
            })
        } else {
            post(route('admin.guru.store-link', guru.id), {
                onSuccess: () => handleCloseForm(),
            })
        }
    }

    const submitDeleteLink = (linkId: number) => {
        if (confirm('Yakin ingin menghapus tautan kelas ini?')) {
            router.delete(route('admin.guru.destroy-link', linkId))
        }
    }

    return (
        <AppLayout 
            breadcrumbs={[
                { title: 'Data Guru', href: '/admin/guru' },
                { title: `Profil: ${guru.name}`, href: `/admin/guru/${guru.id}` }
            ]}
        >
            <Head title={`Profil Guru - ${guru.name}`} />

            <div className="p-6 max-w-7xl mx-auto space-y-6">
                
                {/* Profile Card */}
                <div className="bg-card shadow rounded-lg border border-border p-6">
                    <h2 className="text-xl font-bold mb-4 border-b border-border pb-2">Informasi Profil Guru</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                            <p className="font-medium">{guru.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{guru.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Jabatan</p>
                            <p className="font-medium">
                                {guru.jabatan || <span className="text-muted-foreground italic">Belum ada jabatan</span>}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Wali Kelas / Rombel Utama</p>
                            <p className="font-medium">
                                {guru.rombel_name ? (
                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                        {guru.rombel_name}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground italic">Belum diset</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Classroom Links Section */}
                <div className="bg-card shadow rounded-lg border border-border overflow-hidden">
                    <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                        <h2 className="text-xl font-bold">Daftar Tautan Kelas</h2>
                        <button
                            onClick={isAddingLink ? handleCloseForm : handleOpenForm}
                            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            {isAddingLink ? 'Batal' : '+ Tambah Tautan'}
                        </button>
                    </div>

                    {/* Add/Edit Form */}
                    {isAddingLink && (
                        <div className="p-6 bg-accent/20 border-b border-border">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingLinkId ? 'Edit Tautan Kelas' : 'Form Tambah Tautan Kelas'}
                            </h3>
                            <form onSubmit={submitForm} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Mata Pelajaran</label>
                                        <input
                                            type="text"
                                            value={data.mapel}
                                            onChange={e => setData('mapel', e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                            placeholder="Cth: Matematika"
                                            required
                                        />
                                        {errors.mapel && <p className="text-red-500 text-xs mt-1">{errors.mapel}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Kelas (Rombel) Tujuan</label>
                                        <select
                                            value={data.rombel_id}
                                            onChange={e => setData('rombel_id', e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                            required
                                        >
                                            <option value="" disabled>Pilih Kelas...</option>
                                            {rombels.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                        {errors.rombel_id && <p className="text-red-500 text-xs mt-1">{errors.rombel_id}</p>}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tautan / Link Kelas (Google Meet, Classroom, dll)</label>
                                    <input
                                        type="url"
                                        value={data.link}
                                        onChange={e => setData('link', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                        placeholder="https://meet.google.com/..."
                                        required
                                    />
                                    {errors.link && <p className="text-red-500 text-xs mt-1">{errors.link}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Keterangan (Opsional)</label>
                                    <textarea
                                        value={data.keterangan}
                                        onChange={e => setData('keterangan', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                        rows={2}
                                        placeholder="Catatan tambahan untuk siswa..."
                                    ></textarea>
                                    {errors.keterangan && <p className="text-red-500 text-xs mt-1">{errors.keterangan}</p>}
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan Tautan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Links Table */}
                    {links.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Mata Pelajaran</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Kelas</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tautan</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Dibuat</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {links.map((link) => (
                                        <tr key={link.id} className="hover:bg-accent/10">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {link.mapel}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                    {link.rombel_name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <a href={link.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline max-w-[200px] truncate block">
                                                    {link.link}
                                                </a>
                                                {link.keterangan && (
                                                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-[250px]">{link.keterangan}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {link.created_at}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => handleEditLink(link)}
                                                        className="text-primary hover:text-primary/80"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => submitDeleteLink(link.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-muted-foreground">
                            <p>Guru ini belum membuat tautan kelas apa pun.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
