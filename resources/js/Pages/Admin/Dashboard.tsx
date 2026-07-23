import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Users, Shield, School, Calendar, ClipboardList, Briefcase, LayoutGrid, Layers, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { type SharedData } from '@/types';

interface AdminDashboardProps {
    stats: {
        total_users: number;
        total_roles: number;
        total_admins: number;
    };
    settings: {
        kartu_santri_aktif: boolean;
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

export default function AdminDashboard({ stats, settings }: AdminDashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const isSuperAdmin = (auth.user as any)?.roles?.includes('superadmin');

    const STATS = [
        { label: 'Total Pengguna', value: stats.total_users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
        { label: 'Total Role', value: stats.total_roles, icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
        { label: 'Jumlah Admin', value: stats.total_admins, icon: LayoutGrid, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    ];

    const kartuAktif = settings?.kartu_santri_aktif ?? true;

    const toggleKartuSantri = () => {
        router.post(route('admin.settings.kartu-santri-toggle'), {}, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin Dashboard', href: '/admin/dashboard' }]}>
            <Head title="Admin Dashboard" />

            <div className="p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto space-y-8">

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

                {/* ── Pengaturan Sistem (Superadmin only) ── */}
                {isSuperAdmin && (
                    <div>
                        <h2 className="text-lg font-bold text-foreground mb-4">Pengaturan Sistem</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

                            {/* Toggle Verifikasi Kartu Santri */}
                            <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
                                kartuAktif
                                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/20'
                                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/30'
                            }`}>
                                {/* Glow background */}
                                <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-30 transition-colors duration-300 ${
                                    kartuAktif ? 'bg-emerald-400' : 'bg-slate-400'
                                }`} />

                                <div className="relative flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                                            kartuAktif
                                                ? 'bg-emerald-100 dark:bg-emerald-900/50'
                                                : 'bg-slate-200 dark:bg-slate-700'
                                        }`}>
                                            <CreditCard className={`w-5 h-5 transition-colors duration-300 ${
                                                kartuAktif ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                                            }`} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-foreground">Verifikasi Kartu Santri</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Upload foto kartu santri untuk murid</p>
                                        </div>
                                    </div>

                                    {/* Toggle Switch */}
                                    <button
                                        onClick={toggleKartuSantri}
                                        title={kartuAktif ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                            kartuAktif
                                                ? 'bg-emerald-500 focus:ring-emerald-500'
                                                : 'bg-slate-300 dark:bg-slate-600 focus:ring-slate-400'
                                        }`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                                            kartuAktif ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                    </button>
                                </div>

                                {/* Status Badge */}
                                <div className="relative mt-4 flex items-center gap-1.5">
                                    {kartuAktif ? (
                                        <>
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Aktif — murid dapat upload kartu santri</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-3.5 h-3.5 text-slate-500" />
                                            <span className="text-xs font-medium text-slate-500">Nonaktif — fitur disembunyikan dari murid</span>
                                        </>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                )}

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
