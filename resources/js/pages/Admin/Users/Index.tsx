import React, { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
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

interface JabatanItem {
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
    jabatan: JabatanItem[]
}

export default function UsersIndex({ users, roles, jabatan }: UsersIndexProps) {
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    return (
        <AppLayout breadcrumbs={[{ title: 'Manajemen User', href: '/admin/users' }]}>
            <Head title="Users Management" />

            <div className="p-6">
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Users Management
                    </h1>
                    <Link
                        href={route('admin.users.create')}
                        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        + Add User
                    </Link>
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
                                        Name
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
                                        Roles
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
                                        Verified
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-foreground"
                                    >
                                        Created
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
                                {users.data.map((user) => (
                                    <tr key={user.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                            {user.name}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                            {user.email}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <div className="flex flex-wrap gap-2">
                                                {user.roles.map((role) => (
                                                    <span
                                                        key={role}
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${role === 'admin'
                                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                            }`}
                                                    >
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
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
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                            {user.email_verified_at ? (
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    ✓ Yes
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                    No
                                                </span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                            {user.created_at}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            <div className="flex justify-end items-center gap-3">
                                                <Link
                                                    href={route('admin.users.impersonate', user.id)}
                                                    method="post"
                                                    as="button"
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-md hover:bg-amber-200 transition-colors"
                                                    title="Bypass Login (Masuk sebagai user ini)"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                                                    Bypass
                                                </Link>
                                                <Link
                                                    href={route('admin.users.edit', user.id)}
                                                    className="text-primary hover:text-primary/80"
                                                >
                                                    Edit
                                                </Link>
                                                <Link
                                                    href={route('admin.users.show', user.id)}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    View
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.meta && users.meta.last_page > 1 && (
                        <div className="mt-6 flex justify-between items-center">
                            {users.links?.prev && (
                                <Link
                                    href={users.links.prev}
                                    className="text-primary hover:text-primary/80"
                                >
                                    ← Previous
                                </Link>
                            )}
                            <span className="text-muted-foreground">
                                Page {users.meta.current_page} of {users.meta.last_page}
                            </span>
                            {users.links?.next && (
                                <Link
                                    href={users.links.next}
                                    className="text-primary hover:text-primary/80"
                                >
                                    Next →
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
