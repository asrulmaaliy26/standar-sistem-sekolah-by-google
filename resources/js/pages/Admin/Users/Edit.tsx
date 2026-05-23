import React, { useState } from 'react'
import { Head, useForm, Link, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'

interface Role {
    id: number
    name: string
}

interface JabatanItem {
    id: number
    name: string
}

interface EditProps {
    user: {
        id: number
        name: string
        email: string
        rombel_id?: number | null
    }
    roles: Role[]
    jabatan: JabatanItem[]
    rombels: { id: number; name: string }[]
    userRoles: number[]
    userJabatanIds: number[]
}

export default function Edit({ user, roles, jabatan, rombels, userRoles, userJabatanIds }: EditProps) {
    const { data, setData, put, errors, processing } = useForm({
        name: user.name,
        email: user.email,
        roles: userRoles,
    })

    // Local state jabatan (optimistic update)
    const [currentJabatan, setCurrentJabatan] = useState<number[]>(userJabatanIds)
    const [jabatanLoading, setJabatanLoading] = useState<number | null>(null)

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        put(route('admin.users.update', user.id))
    }

    const toggleRole = (roleId: number) => {
        if (data.roles.includes(roleId)) {
            setData('roles', data.roles.filter((r) => r !== roleId))
        } else {
            setData('roles', [...data.roles, roleId])
        }
    }

    const toggleJabatan = (jabatanId: number) => {
        const hasJabatan = currentJabatan.includes(jabatanId)
        setJabatanLoading(jabatanId)

        if (hasJabatan) {
            router.post(
                route('admin.users.remove-jabatan', user.id),
                { jabatan_id: jabatanId },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setCurrentJabatan((prev) => prev.filter((id) => id !== jabatanId))
                        setJabatanLoading(null)
                    },
                    onError: () => setJabatanLoading(null),
                }
            )
        } else {
            router.post(
                route('admin.users.assign-jabatan', user.id),
                { jabatan_id: jabatanId },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setCurrentJabatan((prev) => [...prev, jabatanId])
                        setJabatanLoading(null)
                    },
                    onError: () => setJabatanLoading(null),
                }
            )
        }
    }

    const handleRombelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (!val) {
            router.post(route('admin.users.remove-rombel', user.id), {}, { preserveScroll: true });
        } else {
            router.post(route('admin.users.assign-rombel', user.id), { rombel_id: val }, { preserveScroll: true });
        }
    }

    return (
        <AppLayout breadcrumbs={[
            { title: 'Manajemen User', href: '/admin/users' },
            { title: 'Edit User', href: `/admin/users/${user.id}/edit` },
        ]}>
            <Head title="Edit User" />

            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight mb-6">Edit User</h1>

                <div className="max-w-2xl space-y-6">
                    {/* Form: Name, Email, Roles */}
                    <div className="bg-card shadow sm:rounded-lg p-6 border border-border">
                        <form onSubmit={submit}>
                            {/* Name */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-foreground">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={`mt-1 block w-full rounded-md px-3 py-2 border bg-background text-foreground ${
                                        errors.name ? 'border-destructive' : 'border-input'
                                    } shadow-sm focus:border-ring focus:outline-none`}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-foreground">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className={`mt-1 block w-full rounded-md px-3 py-2 border bg-background text-foreground ${
                                        errors.email ? 'border-destructive' : 'border-input'
                                    } shadow-sm focus:border-ring focus:outline-none`}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-destructive">{errors.email}</p>
                                )}
                            </div>

                            {/* Roles */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-foreground mb-3">
                                    Roles
                                </label>
                                <div className="space-y-3">
                                    {roles.map((role) => (
                                        <div key={role.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`role-${role.id}`}
                                                checked={data.roles.includes(role.id)}
                                                onChange={() => toggleRole(role.id)}
                                                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                                            />
                                            <label
                                                htmlFor={`role-${role.id}`}
                                                className="ml-3 text-sm text-foreground capitalize"
                                            >
                                                {role.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {errors.roles && (
                                    <p className="mt-1 text-sm text-destructive">{errors.roles}</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Update User
                                </button>
                                <Link
                                    href={route('admin.users.index')}
                                    className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* Jabatan Section - separate card, instant toggle */}
                    <div className="bg-card shadow sm:rounded-lg p-6 border border-border">
                        <h2 className="text-base font-semibold text-foreground mb-1">Jabatan</h2>
                        <p className="text-xs text-muted-foreground mb-4">
                            Jabatan menentukan mode navigasi tambahan yang bisa dipilih user ini.
                            Perubahan langsung tersimpan.
                        </p>
                        <div className="space-y-3">
                            {jabatan.map((j) => {
                                const isChecked = currentJabatan.includes(j.id)
                                const isLoading = jabatanLoading === j.id
                                return (
                                    <div key={j.id} className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleJabatan(j.id)}
                                            disabled={isLoading}
                                            className={`
                                                relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0
                                                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                                                disabled:opacity-60
                                                ${isChecked ? 'bg-primary' : 'bg-muted'}
                                            `}
                                            aria-pressed={isChecked}
                                            aria-label={`Toggle jabatan ${j.name}`}
                                        >
                                            <span className={`
                                                absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                                                ${isChecked ? 'translate-x-4' : 'translate-x-0'}
                                            `} />
                                        </button>
                                        <label className="text-sm text-foreground capitalize select-none cursor-pointer"
                                            onClick={() => !isLoading && toggleJabatan(j.id)}>
                                            {j.name}
                                        </label>
                                        {isLoading && (
                                            <svg className="animate-spin h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                            </svg>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        {jabatan.length === 0 && (
                            <p className="text-sm text-muted-foreground">Belum ada jabatan tersedia.</p>
                        )}
                    </div>

                    {/* Rombel Section */}
                    <div className="bg-card shadow sm:rounded-lg p-6 border border-border">
                        <h2 className="text-base font-semibold text-foreground mb-1">Kelas Siswa</h2>
                        <p className="text-xs text-muted-foreground mb-4">
                            Pilih kelas jika user ini adalah siswa. Perubahan langsung tersimpan.
                        </p>
                        <div>
                            <select
                                defaultValue={user.rombel_id || ''}
                                onChange={handleRombelChange}
                                className="mt-1 block w-full rounded-md px-3 py-2 border border-input bg-background text-foreground shadow-sm focus:border-ring focus:outline-none"
                            >
                                <option value="">-- Belum memilih kelas --</option>
                                {rombels.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
