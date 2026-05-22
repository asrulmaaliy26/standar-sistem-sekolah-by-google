import { router, usePage } from '@inertiajs/react';
import { ChevronDown, LogIn, RotateCcw, Briefcase, UserCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { type Jabatan, type NavigationMode } from '@/types';
import { getModeLabelDisplay } from '@/lib/navigation-config';

interface NavigationModeSwitcherProps {
    roles: string[];
    jabatan: Jabatan[];
    activeMode: NavigationMode;
}

export function NavigationModeSwitcher({ roles, jabatan, activeMode }: NavigationModeSwitcherProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Tutup dropdown saat klik di luar
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const switchMode = (type: 'role' | 'jabatan', value: string) => {
        setOpen(false);
        router.post(
            route('navigation.mode.switch'),
            { type, value },
            { preserveScroll: true },
        );
    };

    const resetMode = () => {
        setOpen(false);
        router.post(route('navigation.mode.reset'), {}, { preserveScroll: true });
    };

    // Hanya tampil jika user punya jabatan
    const hasJabatan = jabatan && jabatan.length > 0;
    if (!hasJabatan && roles.length <= 1) return null;

    const isActive = (type: 'role' | 'jabatan', value: string) =>
        activeMode.type === type && activeMode.value === value;

    const activeLabel = getModeLabelDisplay(activeMode.type, activeMode.value);
    const isDefaultMode = activeMode.type === 'role';

    return (
        <div ref={ref} className="relative px-2 pb-1">
            {/* Trigger Button */}
            <button
                onClick={() => setOpen((o) => !o)}
                className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
                    transition-all duration-200 group
                    ${isDefaultMode
                        ? 'bg-sidebar-accent/50 text-sidebar-accent-foreground hover:bg-sidebar-accent'
                        : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25 ring-1 ring-blue-500/30'
                    }
                `}
                title="Ganti Mode Navigasi"
            >
                {isDefaultMode ? (
                    <UserCircle className="size-3.5 shrink-0 opacity-70" />
                ) : (
                    <Briefcase className="size-3.5 shrink-0" />
                )}
                <span className="truncate flex-1 text-left">{activeLabel}</span>
                <ChevronDown
                    className={`size-3.5 shrink-0 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute left-2 right-2 bottom-full mb-1 z-50 rounded-lg border border-border bg-popover shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-border bg-muted/50">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Mode Navigasi
                        </p>
                    </div>

                    {/* Role Options */}
                    {roles.length > 0 && (
                        <div className="py-1">
                            <p className="px-3 py-1 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                                Role
                            </p>
                            {roles.map((role) => (
                                <button
                                    key={role}
                                    onClick={() => switchMode('role', role)}
                                    className={`
                                        w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left
                                        transition-colors duration-150
                                        ${isActive('role', role)
                                            ? 'bg-primary/10 text-primary font-semibold'
                                            : 'text-foreground hover:bg-accent'
                                        }
                                    `}
                                >
                                    <UserCircle className="size-3.5 shrink-0 opacity-70" />
                                    <span className="capitalize flex-1">{role}</span>
                                    {isActive('role', role) && (
                                        <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">
                                            Aktif
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Jabatan Options */}
                    {hasJabatan && (
                        <>
                            <div className="border-t border-border/60" />
                            <div className="py-1">
                                <p className="px-3 py-1 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                                    Jabatan
                                </p>
                                {jabatan.map((j) => (
                                    <button
                                        key={j.id}
                                        onClick={() => switchMode('jabatan', j.name)}
                                        className={`
                                            w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left
                                            transition-colors duration-150
                                            ${isActive('jabatan', j.name)
                                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                                                : 'text-foreground hover:bg-accent'
                                            }
                                        `}
                                    >
                                        <Briefcase className="size-3.5 shrink-0 opacity-70" />
                                        <span className="capitalize flex-1">{j.name}</span>
                                        {isActive('jabatan', j.name) && (
                                            <span className="text-[9px] bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-bold">
                                                Aktif
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Reset ke default */}
                    {activeMode.type === 'jabatan' && (
                        <>
                            <div className="border-t border-border/60" />
                            <div className="py-1">
                                <button
                                    onClick={resetMode}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150"
                                >
                                    <RotateCcw className="size-3.5 shrink-0" />
                                    <span>Kembali ke Mode Role</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
