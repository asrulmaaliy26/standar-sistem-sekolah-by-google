import React from 'react'
import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'

interface User {
    id: number
    name: string
    email: string
    email_verified_at: string | null
    roles: string[]
    created_at: string
}

interface ShowProps {
    user: User
}

export default function Show({ user }: ShowProps) {
    return (
        <AppLayout breadcrumbs={[
            { title: 'Manajemen User', href: '/admin/users' },
            { title: user.name, href: `/admin/users/${user.id}` },
        ]}>
            <Head title={`User: ${user.name}`} />

            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight mb-6">User Details</h1>

                <div className="max-w-2xl">
                    <div className="bg-card shadow sm:rounded-lg border border-border">
                        <div className="px-4 py-5 sm:p-6">
                            {/* Name */}
                            <div className="mb-6 pb-6 border-b border-border">
                                <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                                <dd className="mt-1 text-lg text-foreground">{user.name}</dd>
                            </div>

                            {/* Email */}
                            <div className="mb-6 pb-6 border-b border-border">
                                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                                <dd className="mt-1 text-lg text-foreground">{user.email}</dd>
                            </div>

                            {/* Status */}
                            <div className="mb-6 pb-6 border-b border-border">
                                <dt className="text-sm font-medium text-muted-foreground">Email Status</dt>
                                <dd className="mt-1">
                                    {user.email_verified_at ? (
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            ✓ Verified
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                            Not Verified
                                        </span>
                                    )}
                                </dd>
                            </div>

                            {/* Roles */}
                            <div className="mb-6 pb-6 border-b border-border">
                                <dt className="text-sm font-medium text-muted-foreground">Roles</dt>
                                <dd className="mt-2 flex flex-wrap gap-2">
                                    {user.roles.map((role) => (
                                        <span
                                            key={role}
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${role === 'admin'
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}
                                        >
                                            {role}
                                        </span>
                                    ))}
                                </dd>
                            </div>

                            {/* Created */}
                            <div className="mb-6">
                                <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                                <dd className="mt-1 text-foreground">{user.created_at}</dd>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-6 border-t border-border">
                                <Link
                                    href={route('admin.users.edit', user.id)}
                                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    Edit
                                </Link>
                                <Link
                                    href={route('admin.users.index')}
                                    className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                >
                                    Back
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
