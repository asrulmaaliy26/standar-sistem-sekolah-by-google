import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, Link } from '@inertiajs/react';
import { LayoutGrid, FolderArchive, BookOpen, School, Users, Calendar, Shield } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

const QUICK_LINKS = [
    { title: 'Pengarsipan', desc: 'Upload dan kelola dokumen sekolah', href: '/arsip', icon: FolderArchive, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-600' },
];

const ADMIN_LINKS = [
    { title: 'Manajemen User', desc: 'Kelola akun pengguna', href: '/admin/users', icon: Users, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600' },
    { title: 'Data Kelas', desc: 'Kelola rombongan belajar', href: '/admin/rombels', icon: School, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600' },
    { title: 'Kalender Kegiatan', desc: 'Jadwal dan agenda sekolah', href: '/calendar', icon: Calendar, color: 'from-orange-500 to-rose-500', bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-600' },
    { title: 'Manajemen Role', desc: 'Hak akses pengguna', href: '/admin/roles', icon: Shield, color: 'from-pink-500 to-rose-600', bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-600' },
];

export default function Dashboard() {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const isAdmin = user?.is_admin;
    const activeMode = user?.active_mode;
    const roleName = activeMode?.value ?? 'user';

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 11) return 'Selamat Pagi';
        if (hour < 15) return 'Selamat Siang';
        if (hour < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="p-6 lg:p-8 max-w-screen-xl mx-auto space-y-8">

                {/* ── Welcome Banner ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-8 text-white shadow-xl shadow-blue-200 dark:shadow-blue-950">
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -bottom-8 -left-6 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative z-10">
                        <p className="text-blue-200 text-sm font-medium mb-1">{greeting()},</p>
                        <h1 className="text-3xl font-extrabold tracking-tight mb-2">{user?.name ?? 'Pengguna'} 👋</h1>
                        <p className="text-blue-100 text-sm">
                            Anda masuk sebagai <span className="font-semibold capitalize bg-white/20 px-2 py-0.5 rounded-full">{roleName}</span>
                        </p>
                    </div>
                    <div className="absolute top-6 right-6 opacity-20">
                        <LayoutGrid className="w-24 h-24" />
                    </div>
                </div>

                {/* ── Quick Links (semua user) ── */}
                <div>
                    <h2 className="text-lg font-bold text-foreground mb-4">Menu Cepat</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {QUICK_LINKS.filter(item => !(roleName === 'murid' && item.title === 'Pengarsipan')).map(item => (
                            <Link key={item.href} href={item.href}
                                className={`group flex items-center gap-4 p-5 rounded-2xl border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
                            >
                                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                                    <item.icon className={`w-6 h-6 ${item.text}`} />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">{item.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                </div>
                            </Link>
                        ))}

                        {/* Tautan kelas untuk murid */}
                        {roleName === 'murid' && (
                            <Link href="/siswa/classroom-links"
                                className="group flex items-center gap-4 p-5 rounded-2xl border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                                <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-6 h-6 text-cyan-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">Daftar Kelas</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Tautan Google Classroom Anda</p>
                                </div>
                            </Link>
                        )}

                        {/* Tautan kelas untuk guru */}
                        {roleName === 'guru' && (
                            <Link href="/guru/classroom-links"
                                className="group flex items-center gap-4 p-5 rounded-2xl border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                                <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-6 h-6 text-cyan-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">Tautan Kelas</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Kelola Google Classroom</p>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>

                {/* ── Admin Menu ── */}
                {isAdmin && (
                    <div>
                        <h2 className="text-lg font-bold text-foreground mb-4">Panel Admin</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {ADMIN_LINKS.map(item => (
                                <Link key={item.href} href={item.href}
                                    className="group flex flex-col gap-3 p-5 rounded-2xl border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center`}>
                                        <item.icon className={`w-5 h-5 ${item.text}`} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground text-sm">{item.title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
