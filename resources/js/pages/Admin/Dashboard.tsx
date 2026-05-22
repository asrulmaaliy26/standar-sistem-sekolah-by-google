import React from 'react'
import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'

interface AdminDashboardProps {
    stats: {
        total_users: number
        total_roles: number
        total_admins: number
    }
}

export default function AdminDashboard({ stats }: AdminDashboardProps) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Admin Dashboard', href: '/admin/dashboard' }]}>
            <Head title="Admin Dashboard" />

            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight mb-6">Admin Dashboard</h1>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
                    {/* Total Users */}
                    <div className="overflow-hidden rounded-lg bg-card px-4 py-5 shadow border border-border sm:px-6">
                        <div className="flex items-baseline">
                            <div>
                                <span className="text-muted-foreground text-sm font-medium">
                                    Total Users
                                </span>
                                <p className="text-3xl font-bold text-foreground mt-2">
                                    {stats.total_users}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Total Roles */}
                    <div className="overflow-hidden rounded-lg bg-card px-4 py-5 shadow border border-border sm:px-6">
                        <div className="flex items-baseline">
                            <div>
                                <span className="text-muted-foreground text-sm font-medium">
                                    Total Roles
                                </span>
                                <p className="text-3xl font-bold text-foreground mt-2">
                                    {stats.total_roles}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Admin Users */}
                    <div className="overflow-hidden rounded-lg bg-card px-4 py-5 shadow border border-border sm:px-6">
                        <div className="flex items-baseline">
                            <div>
                                <span className="text-muted-foreground text-sm font-medium">
                                    Admin Users
                                </span>
                                <p className="text-3xl font-bold text-foreground mt-2">
                                    {stats.total_admins}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Menu */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Users Management */}
                    <div className="overflow-hidden rounded-lg bg-card shadow hover:shadow-lg transition border border-border">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-foreground">
                                        Users Management
                                    </h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Manage users and their roles
                                    </p>
                                </div>
                                <div className="text-3xl">👥</div>
                            </div>
                            <div className="mt-4">
                                <Link
                                    href={route('admin.users.index')}
                                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    Manage Users
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Roles Management */}
                    <div className="overflow-hidden rounded-lg bg-card shadow hover:shadow-lg transition border border-border">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-foreground">
                                        Roles Management
                                    </h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Create and manage roles
                                    </p>
                                </div>
                                <div className="text-3xl">🔑</div>
                            </div>
                            <div className="mt-4">
                                <Link
                                    href={route('admin.roles.index')}
                                    className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                                >
                                    Manage Roles
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
