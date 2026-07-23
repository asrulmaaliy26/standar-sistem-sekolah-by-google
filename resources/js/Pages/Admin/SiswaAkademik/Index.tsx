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
    jenjang?: { id: number; nama: string }
}

interface SiswaIndexProps {
    siswa: {
        data: User[]
        links: any
        meta: any
    }
    rombels: Rombel[]
}

export default function SiswaIndex({ siswa, rombels }: SiswaIndexProps) {
    const [selectedSiswa, setSelectedSiswa] = useState<User | null>(null)
    const [perPage, setPerPage] = useState<number>(10)
    const { data, setData, post, processing, reset } = useForm({
        rombel_id: ''
    })

    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const perPageParam = urlParams.get('per_page')
        if (perPageParam !== null) {
            setPerPage(Number(perPageParam))
        }
    }, [])

    const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = Number(e.target.value)
        setPerPage(value)
        router.get(route('admin.siswa.index'), { per_page: value }, { preserveState: true, replace: true })
    }

    const handleOpenModal = (siswa: User) => {
        setSelectedSiswa(siswa)
        setData('rombel_id', siswa.rombel_id ? siswa.rombel_id.toString() : '')
    }

    const handleCloseModal = () => {
        setSelectedSiswa(null)
        reset()
    }

    const submitAssign = (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedSiswa) {
            post(route('admin.siswa.assign-rombel', selectedSiswa.id), {
                onSuccess: () => handleCloseModal(),
            })
        }
    }

    const submitRemove = (siswa: User) => {
        if (confirm(`Hapus kelas untuk siswa ${siswa.name}?`)) {
            router.post(route('admin.siswa.remove-rombel', siswa.id))
        }
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Data siswa', href: '/admin/siswa' }]}>
            <Head title="Data siswa" />

            <div className="p-4 sm:p-6">
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Data siswa
                    </h1>
                    <select
                        value={perPage}
                        onChange={handlePerPageChange}
                        className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-36"
                    >
                        <option value={10}>10 / halaman</option>
                        <option value={25}>25 / halaman</option>
                        <option value={50}>50 / halaman</option>
                        <option value={0}>Tampilkan Semua</option>
                    </select>
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
                                {siswa.data.map((user) => (
                                    <tr key={user.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                            {user.name}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                            {user.email}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <div className="flex flex-wrap gap-1.5">
                                                {user.jabatan && user.jabatan.length > 0
                                                    ? user.jabatan.map((j) => (
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
                                            {user.rombel_name ? (
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                    {user.rombel_name}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            <div className="flex justify-end items-center gap-3">
                                                <button
                                                    onClick={() => handleOpenModal(user)}
                                                    className="text-primary hover:text-primary/80"
                                                >
                                                    Set Kelas
                                                </button>
                                                {user.rombel_id && (
                                                    <button
                                                        onClick={() => submitRemove(user)}
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
                    {siswa.meta && siswa.meta.last_page > 1 && (
                        <div className="mt-6 flex justify-between items-center">
                            {siswa.links?.prev && (
                                <Link
                                    href={siswa.links.prev}
                                    className="text-primary hover:text-primary/80"
                                >
                                    ← Previous
                                </Link>
                            )}
                            <span className="text-muted-foreground">
                                Page {siswa.meta.current_page} of {siswa.meta.last_page}
                            </span>
                            {siswa.links?.next && (
                                <Link
                                    href={siswa.links.next}
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
            {selectedSiswa && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl border border-border">
                        <h2 className="text-lg font-semibold mb-4">Set Kelas untuk {selectedSiswa.name}</h2>
                        
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
                                    {Object.entries(
                                        rombels.reduce((acc: Record<string, Rombel[]>, rombel) => {
                                            const jenjangName = rombel.jenjang?.nama || 'Tanpa Jenjang';
                                            if (!acc[jenjangName]) acc[jenjangName] = [];
                                            acc[jenjangName].push(rombel);
                                            return acc;
                                        }, {})
                                    ).map(([jenjangName, jenjangRombels]) => (
                                        <optgroup key={jenjangName} label={jenjangName}>
                                            {jenjangRombels.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </optgroup>
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
