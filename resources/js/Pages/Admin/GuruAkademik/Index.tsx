import React, { useState } from 'react'
import { Head, Link, useForm, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'

interface User {
    id: number
    name: string
    email: string
    jabatan: { id: number; name: string }[]
    rombel_id: number | null
    rombel_name: string | null
}

interface Rombel {
    id: number
    name: string
}

interface GuruIndexProps {
    gurus: {
        data: User[]
        links: any
        meta: any
    }
    rombels: Rombel[]
}

export default function GuruIndex({ gurus, rombels }: GuruIndexProps) {
    const [selectedGuru, setSelectedGuru] = useState<User | null>(null)
    const { data, setData, post, processing, reset } = useForm({
        rombel_id: ''
    })

    const handleOpenModal = (guru: User) => {
        setSelectedGuru(guru)
        setData('rombel_id', guru.rombel_id ? guru.rombel_id.toString() : '')
    }

    const handleCloseModal = () => {
        setSelectedGuru(null)
        reset()
    }

    const submitAssign = (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedGuru) {
            post(route('admin.guru.assign-rombel', selectedGuru.id), {
                onSuccess: () => handleCloseModal(),
            })
        }
    }

    const submitRemove = (guru: User) => {
        if (confirm(`Hapus kelas untuk guru ${guru.name}?`)) {
            router.post(route('admin.guru.remove-rombel', guru.id))
        }
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Data Guru', href: '/admin/guru' }]}>
            <Head title="Data Guru" />

            <div className="p-6">
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Data Guru
                    </h1>
                </div>

                <div>
                    {/* Users Table */}
                    <div className="overflow-hidden shadow ring-1 ring-border sm:rounded-lg">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted">
                                <tr>
                                    <th
                                        scope="col"
                                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6"
                                    >
                                        Nama
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-foreground"
                                    >
                                        Email
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-foreground"
                                    >
                                        Jabatan
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-foreground"
                                    >
                                        Kelas (Rombel)
                                    </th>
                                    <th
                                        scope="col"
                                        className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                                    >
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                                {gurus.data.map((guru) => (
                                    <tr key={guru.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                            {guru.name}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                            {guru.email}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <div className="flex flex-wrap gap-1.5">
                                                {guru.jabatan && guru.jabatan.length > 0
                                                    ? guru.jabatan.map((j) => (
                                                        <span
                                                            key={j.id}
                                                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 capitalize"
                                                        >
                                                            {j.name}
                                                        </span>
                                                    ))
                                                    : <span className="text-muted-foreground text-xs">—</span>
                                                }
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            {guru.rombel_name ? (
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                    {guru.rombel_name}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            <div className="flex justify-end items-center gap-3">
                                                <Link
                                                    href={route('admin.guru.show', guru.id)}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    Detail
                                                </Link>
                                                <button
                                                    onClick={() => handleOpenModal(guru)}
                                                    className="text-primary hover:text-primary/80"
                                                >
                                                    Set Kelas
                                                </button>
                                                {guru.rombel_id && (
                                                    <button
                                                        onClick={() => submitRemove(guru)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        Hapus Kelas
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {gurus.meta && gurus.meta.last_page > 1 && (
                        <div className="mt-6 flex justify-between items-center">
                            {gurus.links?.prev && (
                                <Link
                                    href={gurus.links.prev}
                                    className="text-primary hover:text-primary/80"
                                >
                                    ← Previous
                                </Link>
                            )}
                            <span className="text-muted-foreground">
                                Page {gurus.meta.current_page} of {gurus.meta.last_page}
                            </span>
                            {gurus.links?.next && (
                                <Link
                                    href={gurus.links.next}
                                    className="text-primary hover:text-primary/80"
                                >
                                    Next →
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Set Rombel Modal */}
            {selectedGuru && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl border border-border">
                        <h2 className="text-lg font-semibold mb-4">Set Kelas untuk {selectedGuru.name}</h2>
                        
                        <form onSubmit={submitAssign}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">
                                    Pilih Kelas / Rombel
                                </label>
                                <select
                                    value={data.rombel_id}
                                    onChange={e => setData('rombel_id', e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    required
                                >
                                    <option value="" disabled>Pilih Rombel...</option>
                                    {rombels.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    )
}
