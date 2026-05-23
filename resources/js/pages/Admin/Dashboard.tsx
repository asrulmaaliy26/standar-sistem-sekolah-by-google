import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Users, Shield, School, Calendar, ClipboardList, Briefcase, LayoutGrid, Layers } from 'lucide-react';

interface AdminDashboardProps {
    stats: {
        total_users: number;
        total_roles: number;
        total_admins: number;
    };
}

const MENU_CARDS = [
    { title: 'Manajemen User', desc: 'Kelola akun & hak akses pengguna', href: 'admin.users.index', icon: Users, gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600' },
    { title: 'Manajemen Role', desc: 'Buat dan atur role pengguna', href: 'admin.roles.index', icon: Shield, gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-600' },
    { title: 'Manajemen Jabatan', desc: 'Kelola jabatan fungsional', href: 'admin.jabatan.index', icon: Briefcase, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600' },
    { title: 'Data Jenjang', desc: 'Kelola jenjang pendidikan', href: 'admin.jenjang.index', icon: Layers, gradient: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-600' },
    { title: 'Data Kelas', desc: 'Kelola rombongan belajar', href: 'admin.rombels.index', icon: School, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600' },
    { title: 'Kalender Kegiatan', desc: 'Jadwal & agenda sekolah', href: 'calendar', icon: Calendar, gradient: 'from-orange-500 to-rose-500', bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-600' },
    { title: 'Rekapan Kegiatan', desc: 'Laporan dan rekap kalender', href: 'calendar.recap', icon: ClipboardList, gradient: 'from-pink-500 to-rose-600', bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-600' },
];

export default function AdminDashboard({ stats }: AdminDashboardProps) {
    const STATS = [
        { label: 'Total Pengguna', value: stats.total_users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
        { label: 'Total Role', value: stats.total_roles, icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
        { label: 'Jumlah Admin', value: stats.total_admins, icon: LayoutGrid, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin Dashboard', href: '/admin/dashboard' }]}>
            <Head title="Admin Dashboard" />

            <div className="p-6 lg:p-8 max-w-screen-xl mx-auto space-y-8">

                {/* ── Header Banner ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-black p-8 text-white shadow-xl">
                    <div className="absolute -top-8 -right-8 w-44 h-44 bg-white/5 rounded-full blur-2xl" />
                    <div className="absolute -bottom-6 left-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
                    <div className="relative z-10">
                        <p className="text-slate-400 text-sm font-medium mb-1">Selamat datang,</p>
                        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Panel Admin</h1>
                        <p className="text-slate-400 text-sm">Kelola seluruh data dan pengguna sistem sekolah dari sini.</p>
                    </div>
                    <div className="absolute top-6 right-8 opacity-10">
                        <LayoutGrid className="w-20 h-20" />
                    </div>
                </div>

                {/* ── Statistik ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {STATS.map(stat => (
                        <div key={stat.label} className="bg-card border border-border rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className={`w-14 h-14 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                                <stat.icon className={`w-7 h-7 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-3xl font-extrabold text-foreground">{stat.value}</p>
                                <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Menu Grid ── */}
                <div>
                    <h2 className="text-lg font-bold text-foreground mb-4">Menu Manajemen</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {MENU_CARDS.map(card => (
                            <Link
                                key={card.href}
                                href={route(card.href)}
                                className="group flex items-center gap-4 p-5 bg-card border border-border rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
                                    <card.icon className={`w-6 h-6 ${card.text}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-foreground truncate">{card.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
                                </div>
                                <svg className="ml-auto flex-shrink-0 w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        ))}
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
