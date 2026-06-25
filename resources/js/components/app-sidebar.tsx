import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { NavigationModeSwitcher } from '@/components/navigation-mode-switcher';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type Jabatan, type NavigationMode } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder } from 'lucide-react';
import AppLogo from './app-logo';
import { commonNavItems, getNavItemsByMode } from '@/lib/navigation-config';

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props as any;

    const user = auth?.user;

    // Ambil roles, jabatan, dan active_mode dari shared props
    const userRoles: string[] = Array.isArray(user?.roles) ? user.roles : [];
    const userJabatan: Jabatan[] = Array.isArray(user?.jabatan) ? user.jabatan : [];
    const activeMode: NavigationMode = user?.active_mode ?? {
        type: 'role',
        value: userRoles[0] ?? 'user',
    };

    // Dapatkan nav items berdasarkan mode aktif
    const modeNavItems = getNavItemsByMode(activeMode.type, activeMode.value);

    // Sembunyikan menu Pengarsipan khusus untuk murid dan admin penjadwalan
    const filteredCommonNavItems = commonNavItems.filter(item => {
        if (item.title === 'Pengarsipan') {
            if (activeMode.type === 'role' && (activeMode.value === 'murid' || activeMode.value === 'admin penjadwalan')) {
                return false;
            }
        }
        return true;
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Navigasi umum (Dashboard) */}
                <NavMain items={filteredCommonNavItems} label="Umum" />

                {/* Navigasi berdasarkan mode aktif (role/jabatan) */}
                {modeNavItems.length > 0 && (
                    <NavMain items={modeNavItems} label="Menu" />
                )}
            </SidebarContent>

            <SidebarFooter>
                {/* Mode Switcher - tampil jika punya jabatan atau lebih dari 1 role */}
                {(userJabatan.length > 0 || userRoles.length > 1) && (
                    <NavigationModeSwitcher
                        roles={userRoles}
                        jabatan={userJabatan}
                        activeMode={activeMode}
                    />
                )}

                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
