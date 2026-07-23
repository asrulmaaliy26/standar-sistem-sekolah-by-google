import React from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'

interface Role {
    id: number
    name: string
    description: string | null
    users_count: number
    created_at: string
}

interface RolesIndexProps {
    roles: {
        data: Role[]
        links: any
        meta: any
    }
}

export default function RolesIndex({ roles }: RolesIndexProps) {
    const [perPage, setPerPage] = React.useState<number>(10)

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
        router.get(route('admin.roles.index'), { per_page: value }, { preserveState: true, replace: true })
    }

    const handleDelete = (roleId: number) => {
        if (confirm('Are you sure you want to delete this role?')) {
            router.delete(route('admin.roles.destroy', roleId))
        }
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Manajemen Role', href: '/admin/roles' }]}>
            <Head title="Roles Management" />

            <div className="p-4 sm:p-6">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Roles Management
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
                    <Link
                        href={route('admin.roles.create')}
                        className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                        + Add Role
                    </Link>
                </div>

                <div>
                    {/* Roles Table */}
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
                                        Description
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-foreground"
                                    >
                                        Users
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
                                {roles.data.map((role) => (
                                    <tr key={role.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    role.name === 'superadmin'
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}
                                            >
                                                {role.name}
                                            </span>
                                        </td>
                                        <td className="px-3 py-4 text-sm text-muted-foreground">
                                            {role.description || '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                                                {role.users_count}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                            {role.created_at}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={route('admin.roles.show', role.id)}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    View
                                                </Link>
                                                {role.name !== 'superadmin' && role.name !== 'user' && (
                                                    <>
                                                        <Link
                                                            href={route('admin.roles.edit', role.id)}
                                                            className="text-primary hover:text-primary/80"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(role.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {roles.meta && roles.meta.last_page > 1 && (
                        <div className="mt-6 flex justify-between items-center">
                            {roles.links?.prev && (
                                <Link
                                    href={roles.links.prev}
                                    className="text-primary hover:text-primary/80"
                                >
                                    ← Previous
                                </Link>
                            )}
                            <span className="text-muted-foreground">
                                Page {roles.meta.current_page} of {roles.meta.last_page}
                            </span>
                            {roles.links?.next && (
                                <Link
                                    href={roles.links.next}
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
