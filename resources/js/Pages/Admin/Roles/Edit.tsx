import React from 'react'
import { Head, useForm, Link } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'

interface EditProps {
    role: {
        id: number
        name: string
        description: string | null
    }
}

export default function Edit({ role }: EditProps) {
    const { data, setData, put, errors, processing } = useForm({
        name: role.name,
        description: role.description || '',
    })

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        put(route('admin.roles.update', role.id))
    }

    return (
        <AppLayout breadcrumbs={[
            { title: 'Manajemen Role', href: '/admin/roles' },
            { title: 'Edit Role', href: `/admin/roles/${role.id}/edit` },
        ]}>
            <Head title="Edit Role" />

            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight mb-6">Edit Role</h1>

                <div className="max-w-2xl">
                    <div className="bg-card shadow sm:rounded-lg p-6 border border-border">
                        <form onSubmit={submit}>
                            {/* Name */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-foreground">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={`mt-1 block w-full rounded-md px-3 py-2 border bg-background text-foreground ${
                                        errors.name ? 'border-destructive' : 'border-input'
                                    } shadow-sm focus:border-ring focus:ring-ring focus:outline-none`}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-foreground">
                                    Description
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 bg-background text-foreground shadow-sm focus:border-ring focus:ring-ring focus:outline-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                    Update Role
                                </button>
                                <Link
                                    href={route('admin.roles.index')}
                                    className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
