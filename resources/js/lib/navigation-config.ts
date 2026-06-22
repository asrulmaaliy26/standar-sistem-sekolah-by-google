import { type NavItem } from '@/types';
import {
    LayoutGrid,
    Users,
    Shield,
    Calendar,
    ClipboardList,
    School,
    Briefcase,
    FolderArchive,
    Link,
    LayoutDashboard,
    Layers,
    Inbox,
    Send,
    CalendarCheck,
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
    {
        title: 'Pengarsipan',
        href: '/arsip',
        icon: FolderArchive,
    },
];

/**
 * Navigasi berdasarkan ROLE
 * Key = nama role (sesuai database)
 */
export const roleNavigation: Record<string, NavItem[]> = {
    superadmin: [
        {
            title: 'Dashboard',
            href: '/admin/dashboard',
            icon: LayoutDashboard,
        },
        {
            title: 'Pelanggaran',
            href: 'https://docs.google.com/spreadsheets/d/1EleHQr7y9eGg5l3NqnTSUfh8qMpTjM7L-lKDBw9Hql4/edit?usp=sharing',
            icon: ClipboardList,
        },
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
            href: '/calendar',
            icon: Calendar,
        },
        {
            title: 'Rekapan Kegiatan',
            href: '/calendar/recap',
            icon: ClipboardList,
        },
    ],

    'admin akademik': [
        {
            title: 'Dashboard',
            href: '/admin/dashboard',
            icon: LayoutDashboard,
        },
        {
            title: 'Pelanggaran',
            href: 'https://docs.google.com/spreadsheets/d/1EleHQr7y9eGg5l3NqnTSUfh8qMpTjM7L-lKDBw9Hql4/edit?usp=sharing',
            icon: ClipboardList,
        },
        {
            title: 'Data Jenjang',
            href: '/admin/jenjang',
            icon: Layers,
        },
        {
            title: 'Data Kelas',
            href: '/admin/rombels',
            icon: School,
        },
        {
            title: 'Data Guru',
            href: '/admin/guru',
            icon: Users,
        },
        {
            title: 'Ploting Jadwal',
            href: '/admin/krs',
            icon: CalendarCheck,
        },
    ],

    'admin persuratan': [
        {
            title: 'Dashboard',
            href: '/admin/dashboard',
            icon: LayoutDashboard,
        },
        {
            title: 'Pelanggaran',
            href: 'https://docs.google.com/spreadsheets/d/1EleHQr7y9eGg5l3NqnTSUfh8qMpTjM7L-lKDBw9Hql4/edit?usp=sharing',
            icon: ClipboardList,
        },
        {
            title: 'Surat Masuk',
            href: '/admin/surat-masuk',
            icon: Inbox,
        },
        {
            title: 'Surat Keluar',
            href: '/admin/surat-keluar',
            icon: Send,
        },
    ],

    guru: [
        {
            title: 'Kalender Kegiatan',
            href: '/calendar',
            icon: Calendar,
        },
        {
            title: 'Pelanggaran',
            href: 'https://docs.google.com/spreadsheets/d/1EleHQr7y9eGg5l3NqnTSUfh8qMpTjM7L-lKDBw9Hql4/edit?usp=sharing',
            icon: ClipboardList,
        },
        {
            title: 'Tautan Kelas',
            href: '/guru/classroom-links',
            icon: Link,
        },
    ],

    murid: [
        {
            title: 'Kalender Kegiatan',
            href: '/calendar',
            icon: Calendar,
        },
        {
            title: 'Daftar Kelas',
            href: '/siswa/classroom-links',
            icon: Link,
        },
    ],

    // Fallback untuk role yang belum dikonfigurasi
    user: [],
};

/**
 * Navigasi berdasarkan JABATAN
 * Key = nama jabatan (sesuai database)
 * Belum ada route jabatan yang tersedia — dikosongkan sementara
 */
export const jabatanNavigation: Record<string, NavItem[]> = {};

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
