import React, { useState, useEffect } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'

interface User {
    id: number
    name: string
    email: string
    email_verified_at: string | null
    roles: string[]
    jabatan: { id: number; name: string }[]
    rombel_name?: string | null
    created_at: string
}

interface Role {
    id: number
    name: string
}

// Inertia serializes LengthAwarePaginator as a flat object
// with either top-level or nested meta keys depending on version.
// We handle BOTH formats.
interface PaginatedUsers {
    data: User[]
    // format 1: flat (older Inertia)
    current_page?: number
    last_page?: number
    total?: number
    from?: number
    to?: number
    per_page?: number
    links?: any        // array [{url,label,active}] OR object {first,prev,next,last}
    // format 2: nested meta (newer Inertia)
    meta?: {
        current_page: number
        last_page: number
        total: number
        from: number
        to: number
        per_page: number
        links?: { url: string | null; label: string; active: boolean }[]
    }
}

interface UsersIndexProps {
    users: PaginatedUsers
    roles: Role[]
    jabatan: { id: number; name: string }[]
    totalUsers: number
    filters: { search: string; role: string; per_page?: number }
}

export default function UsersIndex({ users, roles, totalUsers, filters }: UsersIndexProps) {
    const [search, setSearch]         = useState(filters.search ?? '')
    const [roleFilter, setRoleFilter] = useState(filters.role ?? '')
    const [perPage, setPerPage]       = useState<number>(filters.per_page ?? 10)

    // Normalise — support both flat and meta-wrapped responses
    const currentPage = users.meta?.current_page ?? users.current_page ?? 1
    const lastPage    = users.meta?.last_page    ?? users.last_page    ?? 1
    const total       = users.meta?.total        ?? users.total        ?? users.data.length
    const fromRow     = users.meta?.from         ?? users.from         ?? 1
    const toRow       = users.meta?.to           ?? users.to           ?? users.data.length
    const showAll     = perPage === 0

    // Debounced search → update URL (reset ke halaman 1)
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                route('admin.users.index'),
                { search, role: roleFilter, per_page: perPage },
                { preserveState: true, replace: true },
            )
        }, 400)
        return () => clearTimeout(timer)
    }, [search, roleFilter, perPage])

    const hasActiveFilter = search !== '' || roleFilter !== ''

    // Build page URL — mempertahankan search & role filter
    const pageUrl = (page: number) =>
        `${route('admin.users.index')}?page=${page}&search=${encodeURIComponent(search)}&role=${encodeURIComponent(roleFilter)}`

    // Hasilkan nomor halaman yang tampil (1 … cur-1 cur cur+1 … lastPage)
    const visiblePages = (): (number | '…')[] => {
        const pages: (number | '…')[] = []
        for (let p = 1; p <= lastPage; p++) {
            if (
                p === 1 ||
                p === lastPage ||
                (p >= currentPage - 2 && p <= currentPage + 2)
            ) {
                pages.push(p)
            } else if (
                (p === currentPage - 3 && p > 1) ||
                (p === currentPage + 3 && p < lastPage)
            ) {
                pages.push('…')
            }
        }
        return pages
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Manajemen User', href: '/admin/users' }]}>
            <Head title="Manajemen User" />

            <div className="p-4 sm:p-6 space-y-5">
                {/* ── Header ── */}
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manajemen User</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Total&nbsp;
                            <span className="font-semibold text-foreground">{totalUsers}</span>
                            &nbsp;user terdaftar
                            {hasActiveFilter && (
                                <span className="ml-1">
                                    &bull;&nbsp;{total} hasil ditemukan
                                </span>
                            )}
                        </p>
                    </div>
                    <Link
                        href={route('admin.users.create')}
                        className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                        + Tambah User
                    </Link>
                </div>

                {/* ── Filter Bar ── */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <div className="relative flex-1 min-w-0">
                        <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama atau email user…"
                            className="w-full rounded-lg border border-border bg-background pl-9 pr-9 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {search && (
                            <button onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                ✕
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="flex-1 sm:flex-none sm:w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua Role</option>
                            {roles.map((r) => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                        </select>

                        {/* Per-page selector */}
                        <select
                            value={perPage}
                            onChange={(e) => setPerPage(Number(e.target.value))}
                            className="flex-1 sm:flex-none sm:w-36 rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={10}>10 / hal</option>
                            <option value={25}>25 / hal</option>
                            <option value={50}>50 / hal</option>
                            <option value={0}>Tampilkan Semua</option>
                        </select>

                        {(hasActiveFilter || perPage !== 10) && (
                            <button
                                onClick={() => { setSearch(''); setRoleFilter(''); setPerPage(10) }}
                                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Mobile View: Cards (Visible only on small screens) ── */}
                <div className="block md:hidden space-y-3">
                    {users.data.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground bg-card rounded-xl border border-border">
                            {hasActiveFilter ? 'Tidak ada user yang cocok.' : 'Belum ada user.'}
                        </div>
                    ) : (
                        users.data.map((user) => (
                            <div key={user.id} className="p-4 bg-card rounded-xl border border-border shadow-sm space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                                            {user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground text-sm truncate">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {user.email_verified_at ? (
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                ✓
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                Belum
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50 text-xs">
                                    {user.roles.map((role) => (
                                        <span key={role} className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium capitalize ${
                                            role === 'superadmin'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                : role === 'guru' || role === 'pendidik'
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}>
                                            {role} {role === 'murid' && user.rombel_name ? `- Kelas ${user.rombel_name}` : ''}
                                        </span>
                                    ))}
                                    {user.jabatan?.map((j) => (
                                        <span key={j.id} className="inline-flex items-center rounded-full px-2.5 py-0.5 font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 capitalize">
                                            {j.name}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                                    <span>Terdaftar: {user.created_at}</span>
                                </div>

                                <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-border/60">
                                    <Link href={route('admin.users.impersonate', user.id)} method="post" as="button"
                                        className="py-1.5 px-2 text-center text-xs font-medium text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 rounded-lg hover:bg-amber-200 transition-colors">
                                        Bypass
                                    </Link>
                                    <Link href={route('admin.users.edit', user.id)}
                                        className="py-1.5 px-2 text-center text-xs font-medium text-blue-700 bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 rounded-lg hover:bg-blue-200 transition-colors">
                                        Edit
                                    </Link>
                                    <Link href={route('admin.users.show', user.id)}
                                        className="py-1.5 px-2 text-center text-xs font-medium text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                                        Detail
                                    </Link>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Hapus user "${user.name}"?`)) {
                                                router.delete(route('admin.users.destroy', user.id))
                                            }
                                        }}
                                        className="py-1.5 px-2 text-center text-xs font-medium text-red-700 bg-red-100 dark:bg-red-950/40 dark:text-red-300 rounded-lg hover:bg-red-200 transition-colors">
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ── Desktop View: Responsive Clean Table (Visible on md and up) ── */}
                <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                                <tr>
                                    <th className="py-3.5 px-4 font-semibold">Pengguna</th>
                                    <th className="py-3.5 px-3 font-semibold">Role & Jabatan</th>
                                    <th className="py-3.5 px-3 font-semibold">Verifikasi</th>
                                    <th className="py-3.5 px-3 font-semibold">Terdaftar</th>
                                    <th className="py-3.5 px-4 text-right font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                                            {hasActiveFilter ? 'Tidak ada user yang cocok.' : 'Belum ada user.'}
                                        </td>
                                    </tr>
                                ) : users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-foreground text-sm leading-tight truncate">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-3">
                                            <div className="flex flex-wrap gap-1 items-center">
                                                {user.roles.length > 0 ? (
                                                    user.roles.map((role) => (
                                                        <span key={role} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                                                            role === 'superadmin'
                                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                                : role === 'guru' || role === 'pendidik'
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                        }`}>
                                                            {role} {role === 'murid' && user.rombel_name ? `- Kelas ${user.rombel_name}` : ''}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                                {user.jabatan?.map((j) => (
                                                    <span key={j.id} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 capitalize">
                                                        {j.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-3 whitespace-nowrap">
                                            {user.email_verified_at ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-400">
                                                    <span>✓</span> Terverifikasi
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-400">
                                                    Belum
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                                            {user.created_at}
                                        </td>
                                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                            <div className="flex justify-end items-center gap-1.5">
                                                <Link href={route('admin.users.impersonate', user.id)} method="post" as="button"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 rounded-md hover:bg-amber-200 transition-colors">
                                                    Bypass
                                                </Link>
                                                <Link href={route('admin.users.edit', user.id)}
                                                    className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 rounded-md hover:bg-blue-200 transition-colors">
                                                    Edit
                                                </Link>
                                                <Link href={route('admin.users.show', user.id)}
                                                    className="px-2.5 py-1 text-xs font-medium text-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors">
                                                    Detail
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Hapus user "${user.name}"?`)) {
                                                            router.delete(route('admin.users.destroy', user.id))
                                                        }
                                                    }}
                                                    className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-100 dark:bg-red-950/40 dark:text-red-300 rounded-md hover:bg-red-200 transition-colors">
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Pagination ── selalu tampil jika ada data */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
                    {/* Info baris */}
                    <p className="text-sm text-muted-foreground">
                        Menampilkan{' '}
                        <span className="font-semibold text-foreground">{fromRow}</span>
                        {' – '}
                        <span className="font-semibold text-foreground">{toRow}</span>
                        {' dari '}
                        <span className="font-semibold text-foreground">{total}</span>
                        {' user'}
                        {lastPage > 1 && (
                            <span className="ml-1 text-muted-foreground">
                                (hal. {currentPage} / {lastPage})
                            </span>
                        )}
                    </p>

                    {/* Tombol halaman */}
                    {lastPage > 1 && (
                        <div className="flex items-center gap-1 flex-wrap justify-center">
                            {/* Prev */}
                            {currentPage > 1 ? (
                                <Link href={pageUrl(currentPage - 1)}
                                    className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted transition-colors">
                                    ← Prev
                                </Link>
                            ) : (
                                <span className="px-3 py-1.5 text-sm rounded-md border border-border bg-muted text-muted-foreground opacity-50 cursor-not-allowed">
                                    ← Prev
                                </span>
                            )}

                            {/* Nomor halaman */}
                            {visiblePages().map((p, i) =>
                                p === '…' ? (
                                    <span key={`e${i}`} className="px-2 py-1.5 text-sm text-muted-foreground">…</span>
                                ) : (
                                    <Link
                                        key={p}
                                        href={pageUrl(p as number)}
                                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                            p === currentPage
                                                ? 'border-blue-600 bg-blue-600 text-white font-semibold'
                                                : 'border-border bg-background hover:bg-muted'
                                        }`}
                                    >
                                        {p}
                                    </Link>
                                )
                            )}

                            {/* Next */}
                            {currentPage < lastPage ? (
                                <Link href={pageUrl(currentPage + 1)}
                                    className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted transition-colors">
                                    Next →
                                </Link>
                            ) : (
                                <span className="px-3 py-1.5 text-sm rounded-md border border-border bg-muted text-muted-foreground opacity-50 cursor-not-allowed">
                                    Next →
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
