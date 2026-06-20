import { usePwa } from '@/hooks/use-pwa';
import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Banner animasi di bagian bawah layar yang mengajak user
 * menginstall Smart LPI Al-Hidayah sebagai app di HP mereka.
 *
 * Muncul otomatis setelah 3 detik jika:
 * - Browser mendukung PWA install (beforeinstallprompt fired)
 * - Belum terinstall sebagai standalone
 * - User belum dismiss di sesi ini
 */
export function PwaInstallPrompt() {
    const { isInstallable, isDismissed, install, dismiss } = usePwa();
    const [visible, setVisible] = useState(false);
    const [installing, setInstalling] = useState(false);

    // Delay munculnya banner agar tidak mengganggu saat halaman pertama load
    useEffect(() => {
        if (!isInstallable || isDismissed) return;

        const timer = setTimeout(() => setVisible(true), 3000);
        return () => clearTimeout(timer);
    }, [isInstallable, isDismissed]);

    if (!visible || !isInstallable || isDismissed) return null;

    const handleInstall = async () => {
        setInstalling(true);
        const outcome = await install();
        setInstalling(false);

        if (outcome === 'accepted') {
            setVisible(false);
        }
    };

    const handleDismiss = () => {
        setVisible(false);
        dismiss();
    };

    return (
        <div
            role="dialog"
            aria-label="Instal aplikasi Smart LPI"
            className={[
                // Posisi: fixed di bawah layar, full-width di mobile
                'fixed bottom-0 left-0 right-0 z-50',
                'mx-auto max-w-lg',
                // Animasi slide-up
                'translate-y-0 opacity-100',
                'transition-all duration-500 ease-out',
                'px-3 pb-3',
            ].join(' ')}
        >
            <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-white p-4 shadow-[0_-2px_32px_rgba(0,0,0,0.12)] dark:bg-zinc-900 dark:shadow-[0_-2px_32px_rgba(0,0,0,0.4)]">
                {/* Accent bar hijau kiri */}
                <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-emerald-600" />

                {/* Ikon app */}
                <img
                    src="/icons/icon-96x96.png"
                    alt="Smart LPI"
                    className="ml-2 h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm"
                />

                {/* Teks */}
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Instal Smart LPI Al-Hidayah
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        Tambahkan ke homescreen — akses lebih cepat, bisa offline
                    </p>
                </div>

                {/* Tombol Instal */}
                <button
                    onClick={handleInstall}
                    disabled={installing}
                    className={[
                        'flex shrink-0 items-center gap-1.5',
                        'rounded-xl bg-emerald-600 px-3 py-2',
                        'text-xs font-semibold text-white',
                        'transition-all duration-150',
                        'hover:bg-emerald-700 active:scale-95',
                        'disabled:opacity-60',
                    ].join(' ')}
                    aria-label="Instal aplikasi"
                >
                    <Download className="h-3.5 w-3.5" />
                    {installing ? 'Menunggu...' : 'Instal'}
                </button>

                {/* Tombol tutup */}
                <button
                    onClick={handleDismiss}
                    className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    aria-label="Tutup banner instalasi"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
