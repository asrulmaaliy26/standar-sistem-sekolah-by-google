import React from 'react'
import { Head, useForm, Link } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'

interface Role {
    id: number
    name: string
}

interface CreateProps {
    roles: Role[]
}

export default function Create({ roles }: CreateProps) {
    const { data, setData, post, errors, processing } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [] as number[],
    })

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        post(route('admin.users.store'))
    }

    const toggleRole = (roleId: number) => {
        if (data.roles.includes(roleId)) {
            setData('roles', data.roles.filter((r) => r !== roleId))
        } else {
            setData('roles', [...data.roles, roleId])
        }
    }

    return (
        <AppLayout breadcrumbs={[
            { title: 'Manajemen User', href: '/admin/users' },
            { title: 'Tambah User', href: '/admin/users/create' },
        ]}>
            <Head title="Create User" />

            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight mb-6">Create User</h1>

                <div className="max-w-2xl">
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

                            {/* Password */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-foreground">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className={`mt-1 block w-full rounded-md px-3 py-2 border bg-background text-foreground ${
                                        errors.password ? 'border-destructive' : 'border-input'
                                    } shadow-sm focus:border-ring focus:outline-none`}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-destructive">{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-foreground">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 bg-background text-foreground shadow-sm focus:border-ring focus:outline-none"
                                />
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
                                                className="ml-3 text-sm text-foreground"
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
                                    Create User
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
                </div>
            </div>
        </AppLayout>
    )
}
