import { Head } from '@inertiajs/react';
import { Download, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { usePwa } from '@/hooks/use-pwa';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Appearance settings',
        href: '/settings/appearance',
    },
];

export default function Appearance() {
    const { isInstallable, isInstalled, install } = usePwa();
    const [isInstalling, setIsInstalling] = useState(false);

    const handleInstall = async () => {
        setIsInstalling(true);
        await install();
        setIsInstalling(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appearance settings" />

            <SettingsLayout>
                <div className="space-y-10">
                    <div className="space-y-6">
                        <HeadingSmall title="Appearance settings" description="Update your account's appearance settings" />
                        <AppearanceTabs />
                    </div>

                    <div className="space-y-6">
                        <HeadingSmall title="Aplikasi Perangkat (PWA)" description="Instal Smart LPI Al-Hidayah ke perangkat Anda agar dapat diakses seperti aplikasi native (bisa offline dan lebih cepat)." />
                        
                        <div className="p-4 border rounded-xl bg-card">
                            {isInstalled ? (
                                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm">Aplikasi Sudah Terinstal</span>
                                        <span className="text-xs text-muted-foreground">Smart LPI Al-Hidayah sudah terpasang di perangkat Anda.</span>
                                    </div>
                                </div>
                            ) : isInstallable ? (
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm">Instal Smart LPI</span>
                                        <span className="text-xs text-muted-foreground">Tambahkan ke homescreen perangkat Anda.</span>
                                    </div>
                                    <Button 
                                        onClick={handleInstall} 
                                        disabled={isInstalling}
                                        className="gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        {isInstalling ? 'Menginstal...' : 'Instal Sekarang'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm text-foreground">Tidak Dapat Menginstal</span>
                                    <span className="text-xs text-muted-foreground">
                                        Browser atau perangkat Anda tidak mendukung instalasi, atau aplikasi sudah terpasang. Pastikan Anda mengakses melalui browser utama (Chrome/Safari).
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
