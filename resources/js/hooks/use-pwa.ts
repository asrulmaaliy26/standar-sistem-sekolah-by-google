import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    prompt(): Promise<void>;
}

interface PwaState {
    /** true jika browser mendukung PWA install */
    isInstallable: boolean;
    /** true jika sudah terinstall (standalone mode) */
    isInstalled: boolean;
    /** true jika sudah dismiss banner install */
    isDismissed: boolean;
    /** Panggil ini untuk membuka dialog install browser */
    install: () => Promise<'accepted' | 'dismissed' | null>;
    /** Sembunyikan banner install untuk sesi ini */
    dismiss: () => void;
}

const DISMISSED_KEY = 'pwa-install-dismissed';

export function usePwa(): PwaState {
    const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
    const [isDismissed, setIsDismissed] = useState<boolean>(() => {
        try {
            return sessionStorage.getItem(DISMISSED_KEY) === 'true';
        } catch {
            return false;
        }
    });

    // Deteksi apakah sudah berjalan sebagai PWA standalone
    const isInstalled =
        window.matchMedia('(display-mode: standalone)').matches ||
        // iOS Safari
        (window.navigator as { standalone?: boolean }).standalone === true;

    useEffect(() => {
        const handler = (e: Event) => {
            // Tahan dialog install browser — kita tampilkan sendiri
            e.preventDefault();
            setPromptEvent(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Saat app berhasil diinstall, hapus prompt
        window.addEventListener('appinstalled', () => {
            setPromptEvent(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const install = useCallback(async (): Promise<'accepted' | 'dismissed' | null> => {
        if (!promptEvent) return null;

        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;

        // Setelah prompt ditampilkan, tidak bisa dipakai lagi
        setPromptEvent(null);
        return outcome;
    }, [promptEvent]);

    const dismiss = useCallback(() => {
        setIsDismissed(true);
        try {
            sessionStorage.setItem(DISMISSED_KEY, 'true');
        } catch {
            // ignore storage errors
        }
    }, []);

    return {
        isInstallable: !!promptEvent && !isInstalled,
        isInstalled,
        isDismissed,
        install,
        dismiss,
    };
}
