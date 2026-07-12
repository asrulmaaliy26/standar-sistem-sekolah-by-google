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

/** Banner yang tampil di atas sidebar saat sedang bypass/impersonate user */
function SidebarBypassBanner() {
    const { auth } = usePage().props as any;
    if (!auth?.is_impersonating) return null;

    return (
        <div className="mx-2 mb-1 overflow-hidden rounded-xl bg-gray-900 dark:bg-black border border-white/10 shadow-lg group-data-[collapsible=icon]:mx-1">
            {/* Expanded state */}
            <div className="group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-1.5">
                    {/* Pulse dot */}
                    <div className="relative flex-shrink-0">
                        <span className="absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                    </div>
                    <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-amber-400/80">
                            Bypass Mode
                        </span>
                        <span className="text-xs font-bold text-white truncate">
                            {auth.user.name}
                        </span>
                    </div>
                </div>
                <div className="px-2 pb-2">
                    <Link
                        href="/leave-impersonate"
                        method="post"
                        as="button"
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/8 hover:bg-red-500/80 text-white/60 hover:text-white border border-white/10 hover:border-red-500/40 transition-all duration-200"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>
                        </svg>
                        Keluar dari Bypass
                    </Link>
                </div>
            </div>

            {/* Collapsed / icon-only state */}
            <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center py-2 gap-1.5">
                <div className="relative">
                    <span className="absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                </div>
                <Link
                    href="/leave-impersonate"
                    method="post"
                    as="button"
                    title="Keluar dari Bypass"
                    className="p-1.5 rounded-lg bg-white/8 hover:bg-red-500/80 text-white/60 hover:text-white border border-white/10 hover:border-red-500/40 transition-all duration-200"
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>
                    </svg>
                </Link>
            </div>
        </div>
    );
}

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
            {/* Bypass banner — selalu on top sidebar saat impersonate */}
            <SidebarBypassBanner />

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
