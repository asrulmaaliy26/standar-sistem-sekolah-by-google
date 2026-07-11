import React, { useState, useEffect, useCallback } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'

interface User {
    id: number
    name: string
    email: string
    email_verified_at: string | null
    roles: string[]
    jabatan: { id: number; name: string }[]
    created_at: string
}

interface Role {
    id: number
    name: string
}

interface UsersIndexProps {
    users: {
        data: User[]
        links: any
        meta: any
    }
    roles: Role[]
    jabatan: { id: number; name: string }[]
    totalUsers: number
    filters: {
        search: string
        role: string
    }
}

export default function UsersIndex({ users, roles, totalUsers, filters }: UsersIndexProps) {
    const [search, setSearch]       = useState(filters.search ?? '')
    const [roleFilter, setRoleFilter] = useState(filters.role ?? '')

    // Debounced search → update URL
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                route('admin.users.index'),
                { search, role: roleFilter },
                { preserveState: true, replace: true },
            )
        }, 400)
        return () => clearTimeout(timer)
    }, [search, roleFilter])

    const handleClearFilters = () => {
        setSearch('')
        setRoleFilter('')
    }

    const hasActiveFilter = search !== '' || roleFilter !== ''

    return (
        <AppLayout breadcrumbs={[{ title: 'Manajemen User', href: '/admin/users' }]}>
            <Head title="Users Management" />

            <div className="p-6 space-y-5">
                {/* ── Header ── */}
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Manajemen User</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Total&nbsp;
                                <span className="font-semibold text-foreground">{totalUsers}</span>
                                &nbsp;user terdaftar
                                {hasActiveFilter && (
                                    <span className="ml-1">
                                        &bull;&nbsp;Menampilkan{' '}
                                        <span className="font-semibold text-foreground">
                                            {users.meta?.total ?? users.data.length}
                                        </span>{' '}
                                        hasil pencarian
                                    </span>
                                )}
                            </p>
                        </div>
                        <Link
                            href={route('admin.users.create')}
                            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Tambah User
                        </Link>
                    </div>
                </div>

                {/* ── Filter Bar ── */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <svg
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            id="search-users"
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama atau email user…"
                            className="w-full rounded-md border border-border bg-background pl-9 pr-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Role Filter */}
                    <select
                        id="filter-role"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-44"
                    >
                        <option value="">Semua Role</option>
                        {roles.map((r) => (
                            <option key={r.id} value={r.name}>
                                {r.name}
                            </option>
                        ))}
                    </select>

                    {hasActiveFilter && (
                        <button
                            onClick={handleClearFilters}
                            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                            Reset Filter
                        </button>
                    )}
                </div>

                {/* ── Table ── */}
                <div className="overflow-hidden shadow ring-1 ring-border sm:rounded-lg">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted">
                            <tr>
                                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">
                                    Nama
                                </th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                    Email
                                </th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                    Role
                                </th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                    Jabatan
                                </th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                    Verified
                                </th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                    Terdaftar
                                </th>
                                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span className="sr-only">Aksi</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {users.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                                        {hasActiveFilter
                                            ? 'Tidak ada user yang cocok dengan pencarian.'
                                            : 'Belum ada user terdaftar.'}
                                    </td>
                                </tr>
                            ) : (
                                users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/40 transition-colors">
                                        <td className="py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                            {user.name}
                                        </td>
                                        <td className="px-3 py-4 text-sm text-muted-foreground">
                                            {user.email}
                                        </td>
                                        <td className="px-3 py-4 text-sm">
                                            <div className="flex flex-wrap gap-1.5">
                                                {user.roles.length > 0
                                                    ? user.roles.map((role) => (
                                                        <span
                                                            key={role}
                                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                                                                role === 'superadmin'
                                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                                    : role === 'guru' || role === 'pendidik'
                                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                            }`}
                                                        >
                                                            {role}
                                                        </span>
                                                    ))
                                                    : <span className="text-muted-foreground text-xs">—</span>
                                                }
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-sm">
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
                                        <td className="px-3 py-4 text-sm">
                                            {user.email_verified_at ? (
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    ✓ Terverifikasi
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                    Belum
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-4 text-sm text-muted-foreground whitespace-nowrap">
                                            {user.created_at}
                                        </td>
                                        <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            <div className="flex justify-end items-center gap-2">
                                                <Link
                                                    href={route('admin.users.impersonate', user.id)}
                                                    method="post"
                                                    as="button"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-md hover:bg-amber-200 transition-colors"
                                                    title="Masuk sebagai user ini"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                                        <polyline points="10 17 15 12 10 7" />
                                                        <line x1="15" y1="12" x2="3" y2="12" />
                                                    </svg>
                                                    Bypass
                                                </Link>
                                                <Link
                                                    href={route('admin.users.edit', user.id)}
                                                    className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                                                >
                                                    Edit
                                                </Link>
                                                <Link
                                                    href={route('admin.users.show', user.id)}
                                                    className="px-2.5 py-1 text-xs font-medium text-muted-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors"
                                                >
                                                    Detail
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Yakin ingin menghapus user "${user.name}"?`)) {
                                                            router.delete(route('admin.users.destroy', user.id))
                                                        }
                                                    }}
                                                    className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                {users.meta && users.meta.last_page > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                        <p className="text-sm text-muted-foreground">
                            Halaman{' '}
                            <span className="font-medium text-foreground">{users.meta.current_page}</span>
                            {' '}dari{' '}
                            <span className="font-medium text-foreground">{users.meta.last_page}</span>
                            {' '}— total{' '}
                            <span className="font-medium text-foreground">{users.meta.total}</span> user
                        </p>
                        <div className="flex items-center gap-1">
                            {/* First */}
                            {users.meta.current_page > 1 && (
                                <Link
                                    href={users.links?.first ?? '#'}
                                    className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-background hover:bg-muted transition-colors"
                                >
                                    «
                                </Link>
                            )}
                            {/* Prev */}
                            {users.links?.prev && (
                                <Link
                                    href={users.links.prev}
                                    className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted transition-colors"
                                >
                                    ← Prev
                                </Link>
                            )}

                            {/* Page number buttons (max 5 visible) */}
                            {Array.from({ length: users.meta.last_page }, (_, i) => i + 1)
                                .filter((p) => {
                                    const cur = users.meta.current_page
                                    return p === 1 || p === users.meta.last_page || Math.abs(p - cur) <= 2
                                })
                                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                                    acc.push(p)
                                    return acc
                                }, [])
                                .map((p, i) =>
                                    p === '...' ? (
                                        <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-muted-foreground">…</span>
                                    ) : (
                                        <Link
                                            key={p}
                                            href={`${route('admin.users.index')}?page=${p}&search=${encodeURIComponent(search)}&role=${encodeURIComponent(roleFilter)}`}
                                            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                                p === users.meta.current_page
                                                    ? 'border-blue-600 bg-blue-600 text-white'
                                                    : 'border-border bg-background hover:bg-muted'
                                            }`}
                                        >
                                            {p}
                                        </Link>
                                    ),
                                )
                            }

                            {/* Next */}
                            {users.links?.next && (
                                <Link
                                    href={users.links.next}
                                    className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted transition-colors"
                                >
                                    Next →
                                </Link>
                            )}
                            {/* Last */}
                            {users.meta.current_page < users.meta.last_page && (
                                <Link
                                    href={users.links?.last ?? '#'}
                                    className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-background hover:bg-muted transition-colors"
                                >
                                    »
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
