import React, { useState } from 'react'
import { Head, Link, useForm, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Inbox, Plus, Search, FileText } from 'lucide-react'

interface SuratMasuk {
    id: number
    no_agenda: string
    no_surat: string
    tanggal_surat: string
    tanggal_terima: string
    pengirim: string
    perihal: string
    sifat: string
    status: string
    file_surat: string | null
    created_at: string
}

interface IndexProps {
    suratMasuk: {
        data: SuratMasuk[]
        links: any
        meta: any
    }
    filters: {
        search?: string
        status?: string
    }
}

export default function SuratMasukIndex({ suratMasuk, filters }: IndexProps) {
    const { data, setData, get } = useForm({
        search: filters.search || '',
        status: filters.status || '',
    })

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        get(route('admin.surat-masuk.index'), { preserveState: true })
    }

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus surat masuk ini?')) {
            router.delete(route('admin.surat-masuk.destroy', id))
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Baru': return 'bg-blue-100 text-blue-800'
            case 'Diproses': return 'bg-yellow-100 text-yellow-800'
            case 'Selesai': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getSifatColor = (sifat: string) => {
        switch (sifat) {
            case 'Rahasia': return 'text-red-600 font-bold'
            case 'Penting': return 'text-orange-600 font-medium'
            default: return 'text-gray-600'
        }
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Surat Masuk', href: '/admin/surat-masuk' }]}>
            <Head title="Data Surat Masuk" />

            <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                            <Inbox size={24} />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
                            Surat Masuk
                        </h1>
                    </div>
                    
                    <Link
                        href={route('admin.surat-masuk.create')}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        Input Surat Masuk
                    </Link>
                </div>

                {/* Filter & Search */}
                <div className="bg-card shadow-sm rounded-lg border border-border p-4 mb-6">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={18} className="text-muted-foreground" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari no surat, pengirim, atau perihal..."
                                value={data.search}
                                onChange={e => setData('search', e.target.value)}
                                className="block w-full pl-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-input"
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <select
                                value={data.status}
                                onChange={e => {
                                    setData('status', e.target.value)
                                    get(route('admin.surat-masuk.index'), { preserveState: true })
                                }}
                                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                            >
                                <option value="">Semua Status</option>
                                <option value="Baru">Baru</option>
                                <option value="Diproses">Diproses</option>
                                <option value="Selesai">Selesai</option>
                            </select>
                        </div>
                        <button type="submit" className="hidden sm:block px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 border border-border">
                            Cari
                        </button>
                    </form>
                </div>

                {/* Data Table */}
                <div className="bg-card shadow-sm border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">No. Agenda / Surat</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tgl Diterima</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pengirim / Perihal</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sifat</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                                {suratMasuk.data.length > 0 ? (
                                    suratMasuk.data.map((surat) => (
                                        <tr key={surat.id} className="hover:bg-accent/10 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-sm">{surat.no_agenda}</div>
                                                <div className="text-xs text-muted-foreground mt-1">{surat.no_surat || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {surat.tanggal_terima ? new Date(surat.tanggal_terima).toLocaleDateString('id-ID') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-sm text-foreground">{surat.pengirim}</div>
                                                <div className="text-sm text-muted-foreground mt-1 line-clamp-2" title={surat.perihal}>{surat.perihal}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={getSifatColor(surat.sifat)}>
                                                    {surat.sifat}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(surat.status)}`}>
                                                    {surat.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-3 items-center">
                                                    {surat.file_surat && (
                                                        <a 
                                                            href={`/storage/${surat.file_surat}`} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                                            title="Lihat File"
                                                        >
                                                            <FileText size={16} />
                                                        </a>
                                                    )}
                                                    <Link
                                                        href={route('admin.surat-masuk.edit', surat.id)}
                                                        className="text-amber-600 hover:text-amber-900"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(surat.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                            <Inbox className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                                            <p>Tidak ada data surat masuk ditemukan.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {suratMasuk.meta && suratMasuk.meta.last_page > 1 && (
                    <div className="mt-6 flex justify-between items-center">
                        {suratMasuk.links?.prev && (
                            <Link href={suratMasuk.links.prev} className="text-primary hover:text-primary/80">← Previous</Link>
                        )}
                        <span className="text-sm text-muted-foreground">
                            Halaman {suratMasuk.meta.current_page} dari {suratMasuk.meta.last_page}
                        </span>
                        {suratMasuk.links?.next && (
                            <Link href={suratMasuk.links.next} className="text-primary hover:text-primary/80">Next →</Link>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
