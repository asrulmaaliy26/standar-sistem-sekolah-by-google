import { type NavItem } from '@/types';
import {
    LayoutGrid,
    Users,
    Shield,
    Calendar,
    ClipboardList,
    BookOpen,
    GraduationCap,
    School,
    ClipboardCheck,
    UserCheck,
    FileText,
    Settings,
    BarChart3,
    BookMarked,
    CalendarDays,
    Briefcase,
} from 'lucide-react';

/**
 * Navigasi umum yang muncul di semua mode
 */
export const commonNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
];

/**
 * Navigasi berdasarkan ROLE
 * Key = nama role (sesuai database)
 */
export const roleNavigation: Record<string, NavItem[]> = {
    admin: [
        {
            title: 'Manajemen User',
            href: '/admin/users',
            icon: Users,
        },
        {
            title: 'Manajemen Role',
            href: '/admin/roles',
            icon: Shield,
        },
        {
            title: 'Manajemen Jabatan',
            href: '/admin/jabatan',
            icon: Briefcase,
        },
        {
            title: 'Kalender Kegiatan',
            href: '/admin/calendar',
            icon: Calendar,
        },
        {
            title: 'Rekapan Kegiatan',
            href: '/admin/calendar/recap',
            icon: ClipboardList,
        },
    ],

    guru: [
        {
            title: 'Jadwal Mengajar',
            href: '/guru/jadwal',
            icon: CalendarDays,
        },
        {
            title: 'Absensi Siswa',
            href: '/guru/absensi',
            icon: ClipboardCheck,
        },
        {
            title: 'Nilai & Rapor',
            href: '/guru/nilai',
            icon: BarChart3,
        },
        {
            title: 'Materi Ajar',
            href: '/guru/materi',
            icon: BookOpen,
        },
    ],

    siswa: [
        {
            title: 'Jadwal Pelajaran',
            href: '/siswa/jadwal',
            icon: CalendarDays,
        },
        {
            title: 'Nilai Saya',
            href: '/siswa/nilai',
            icon: BarChart3,
        },
        {
            title: 'Materi & Tugas',
            href: '/siswa/materi',
            icon: BookMarked,
        },
        {
            title: 'Absensi Saya',
            href: '/siswa/absensi',
            icon: ClipboardCheck,
        },
    ],

    // Fallback untuk role yang belum dikonfigurasi
    user: [],
};

/**
 * Navigasi berdasarkan JABATAN
 * Key = nama jabatan (sesuai database)
 */
export const jabatanNavigation: Record<string, NavItem[]> = {
    'kepala sekolah': [
        {
            title: 'Laporan Sekolah',
            href: '/jabatan/kepala-sekolah/laporan',
            icon: FileText,
        },
        {
            title: 'Data Guru & Staff',
            href: '/jabatan/kepala-sekolah/guru',
            icon: Users,
        },
        {
            title: 'Kalender Kegiatan',
            href: '/admin/calendar',
            icon: Calendar,
        },
        {
            title: 'Statistik Sekolah',
            href: '/jabatan/kepala-sekolah/statistik',
            icon: BarChart3,
        },
        {
            title: 'Pengaturan Sekolah',
            href: '/jabatan/kepala-sekolah/pengaturan',
            icon: Settings,
        },
    ],

    'wali kelas': [
        {
            title: 'Data Siswa Kelas',
            href: '/jabatan/wali-kelas/siswa',
            icon: GraduationCap,
        },
        {
            title: 'Absensi Kelas',
            href: '/jabatan/wali-kelas/absensi',
            icon: ClipboardCheck,
        },
        {
            title: 'Nilai Kelas',
            href: '/jabatan/wali-kelas/nilai',
            icon: BarChart3,
        },
        {
            title: 'Bimbingan Siswa',
            href: '/jabatan/wali-kelas/bimbingan',
            icon: UserCheck,
        },
        {
            title: 'Rapor Kelas',
            href: '/jabatan/wali-kelas/rapor',
            icon: FileText,
        },
    ],

    kurikulum: [
        {
            title: 'Manajemen Kurikulum',
            href: '/jabatan/kurikulum/manajemen',
            icon: BookOpen,
        },
        {
            title: 'Jadwal Pelajaran',
            href: '/jabatan/kurikulum/jadwal',
            icon: CalendarDays,
        },
        {
            title: 'Distribusi Guru',
            href: '/jabatan/kurikulum/distribusi',
            icon: School,
        },
        {
            title: 'Silabus & RPP',
            href: '/jabatan/kurikulum/silabus',
            icon: BookMarked,
        },
        {
            title: 'Kalender Akademik',
            href: '/jabatan/kurikulum/kalender',
            icon: Calendar,
        },
    ],
};

/**
 * Helper: dapatkan NavItems berdasarkan active_mode
 */
export function getNavItemsByMode(
    type: 'role' | 'jabatan',
    value: string,
): NavItem[] {
    if (type === 'role') {
        return roleNavigation[value] ?? roleNavigation['user'] ?? [];
    }
    return jabatanNavigation[value] ?? [];
}

/**
 * Helper: label tampilan untuk mode aktif
 */
export function getModeLabelDisplay(type: 'role' | 'jabatan', value: string): string {
    if (type === 'role') {
        return `Mode: ${value.charAt(0).toUpperCase() + value.slice(1)}`;
    }
    return value
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}
