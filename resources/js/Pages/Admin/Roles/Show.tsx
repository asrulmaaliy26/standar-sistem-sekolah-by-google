import React from 'react'
import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'

interface User {
    id: number
    name: string
    email: string
}

interface ShowProps {
    role: {
        id: number
        name: string
        description: string | null
        created_at: string
    }
    users: {
        data: User[]
        links: any
        meta: any
    }
}

export default function Show({ role, users }: ShowProps) {
    return (
        <AppLayout breadcrumbs={[
            { title: 'Manajemen Role', href: '/admin/roles' },
            { title: role.name, href: `/admin/roles/${role.id}` },
        ]}>
            <Head title={`Role: ${role.name}`} />

            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight mb-6">Role Details</h1>

                {/* Role Info */}
                <div className="mb-8 bg-card shadow sm:rounded-lg border border-border">
                    <div className="px-4 py-5 sm:p-6">
                        {/* Name */}
                        <div className="mb-6 pb-6 border-b border-border">
                            <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                            <dd className="mt-1 text-lg text-foreground">{role.name}</dd>
                        </div>

                        {/* Description */}
                        {role.description && (
                            <div className="mb-6 pb-6 border-b border-border">
                                <dt className="text-sm font-medium text-muted-foreground">
                                    Description
                                </dt>
                                <dd className="mt-1 text-foreground">{role.description}</dd>
                            </div>
                        )}

                        {/* Created */}
                        <div className="mb-6">
                            <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                            <dd className="mt-1 text-foreground">{role.created_at}</dd>
                        </div>
                    </div>
                </div>

                {/* Users with this role */}
                <div className="bg-card shadow sm:rounded-lg border border-border">
                    <div className="px-4 py-5 sm:p-6">
                        <h2 className="mb-4 text-lg font-medium text-foreground">
                            Users with this role ({users.meta?.total || 0})
                        </h2>

                        {users.data.length > 0 ? (
                            <>
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
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <Link
                                                        href={route('admin.users.show', user.id)}
                                                        className="text-primary hover:text-primary/80"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

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
                            </>
                        ) : (
                            <p className="text-muted-foreground">No users have this role yet</p>
                        )}
                    </div>
                </div>

                {/* Back link */}
                <div className="mt-6">
                    <Link
                        href={route('admin.roles.index')}
                        className="text-primary hover:text-primary/80"
                    >
                        ← Back to Roles
                    </Link>
                </div>
            </div>
        </AppLayout>
    )
}
