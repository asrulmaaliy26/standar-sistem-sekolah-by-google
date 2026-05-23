import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Users, School, MapPin, Layers, Mail, ChevronLeft } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
}

interface ShowProps {
    rombel: {
        id: number;
        name: string;
        lokasi: string | null;
        jenjang: string;
    };
    users: User[];
}

export default function Show({ rombel, users }: ShowProps) {
    return (
        <AppLayout breadcrumbs={[
            { title: 'Data Kelas', href: '/admin/rombels' },
            { title: `Kelas ${rombel.name}`, href: `/admin/rombels/${rombel.id}` },
        ]}>
            <Head title={`Murid Kelas ${rombel.name}`} />

            <div className="p-6 lg:p-8 max-w-screen-xl mx-auto space-y-8">
                
                {/* ── Header ── */}
                <div className="flex flex-col gap-4">
                    <Link href="/admin/rombels" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors self-start">
                        <ChevronLeft className="w-4 h-4" />
                        Kembali ke Data Kelas
                    </Link>
                    
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 flex-shrink-0 mt-1">
                            <School className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Kelas {rombel.name}</h1>
                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-200">
                                    <Layers className="w-4 h-4" />
                                    {rombel.jenjang}
                                </span>
                                {rombel.lokasi && (
                                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                        <MapPin className="w-4 h-4" />
                                        {rombel.lokasi}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 bg-blue-50 dark:bg-blue-950/30 px-3 py-1 rounded-full border border-blue-200">
                                    <Users className="w-4 h-4" />
                                    {users.length} Murid
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Users List ── */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-border bg-muted/20">
                        <h2 className="text-lg font-bold text-foreground">Daftar Murid</h2>
                    </div>

                    {users.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">Belum ada murid</h3>
                            <p className="text-sm text-muted-foreground">Belum ada murid yang terdaftar atau memilih kelas ini.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {users.map((user, index) => (
                                <div key={user.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-muted/30 transition-colors">
                                    <div className="w-8 font-medium text-muted-foreground text-center flex-shrink-0 hidden sm:block">
                                        {index + 1}
                                    </div>
                                    <div className="flex items-center gap-4 flex-1">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.name} className="w-12 h-12 rounded-full border border-border object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-200">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-foreground text-base">{user.name}</h3>
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                                                <Mail className="w-3.5 h-3.5" />
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 self-start sm:self-auto">
                                        <Link href={`/admin/users?search=${encodeURIComponent(user.email)}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted hover:text-foreground transition-colors">
                                            Kelola Akun
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </AppLayout>
    );
}
