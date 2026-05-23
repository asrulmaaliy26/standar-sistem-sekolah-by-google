import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode, useState, useEffect, useRef } from 'react';
import { usePage, Link, router } from '@inertiajs/react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

function ImpersonateBanner() {
    const { auth } = usePage().props as any;
    if (!auth?.is_impersonating) return null;

    const [position, setPosition] = useState({ x: -1000, y: -1000 }); // hidden initially to avoid flash
    const [isDragging, setIsDragging] = useState(false);
    const [hasDragged, setHasDragged] = useState(false);
    const dragRef = useRef<HTMLDivElement>(null);
    const posRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        // Init position bottom right (around bottom 5%, right 5%)
        const initialX = Math.max(20, window.innerWidth - 280);
        const initialY = Math.max(20, window.innerHeight - 100);
        setPosition({ x: initialX, y: initialY });
        posRef.current = { x: initialX, y: initialY };
    }, []);

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        setHasDragged(false);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (isDragging) {
            setHasDragged(true);
            
            // Constrain to window bounds
            const newX = Math.min(Math.max(0, posRef.current.x + e.movementX), window.innerWidth - 250);
            const newY = Math.min(Math.max(0, posRef.current.y + e.movementY), window.innerHeight - 60);
            
            posRef.current = { x: newX, y: newY };
            setPosition(posRef.current);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    return (
        <div
            ref={dragRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 99999,
                touchAction: 'none'
            }}
            className={`flex items-center gap-3 px-4 py-2 bg-amber-500 text-white rounded-full shadow-2xl cursor-grab active:cursor-grabbing transition-transform ${isDragging ? 'scale-105 shadow-amber-500/50' : 'hover:scale-105'}`}
        >
            <div className="flex flex-col select-none pointer-events-none">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Bypass Mode</span>
                <span className="text-sm font-bold truncate max-w-[120px]">{auth.user.name}</span>
            </div>
            
            <Link
                href="/leave-impersonate"
                method="post"
                as="button"
                onPointerDown={(e) => e.stopPropagation()}
                className="ml-2 p-2 bg-amber-600 hover:bg-amber-700 rounded-full transition-colors shadow-inner"
                title="Kembali ke Admin"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
            </Link>
        </div>
    );
}

function RombelPopup() {
    const { auth, rombels } = usePage().props as any;
    const [isOpen, setIsOpen] = useState(true);
    const [selectedRombel, setSelectedRombel] = useState('');
    const [processing, setProcessing] = useState(false);

    // Only show if user is murid, rombel_id is null, and rombels are loaded
    const activeMode = auth?.user?.active_mode;
    const isMurid = activeMode?.value === 'murid' || auth?.user?.roles?.includes('murid');
    if (!auth?.user || !isMurid || auth.user.rombel_id !== null || !rombels?.length || !isOpen) {
        return null;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRombel) return;
        
        setProcessing(true);
        router.post(route('siswa.profile.rombel'), { rombel_id: selectedRombel }, {
            onSuccess: () => {
                setIsOpen(false);
                setProcessing(false);
            },
            onError: () => setProcessing(false),
        });
    };

    // Group rombels by jenjang
    const groupedRombels = rombels.reduce((acc: any, rombel: any) => {
        const jenjangName = rombel.jenjang?.nama || 'Tanpa Jenjang';
        if (!acc[jenjangName]) acc[jenjangName] = [];
        acc[jenjangName].push(rombel);
        return acc;
    }, {});

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border p-6 relative overflow-hidden flex flex-col max-h-[90vh]">
                <button 
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 p-1.5 rounded-full transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                
                <div className="text-center mb-6 mt-2 shrink-0">
                    <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Pilih Kelas Anda</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        Silakan pilih kelas Anda saat ini. Pilihan ini permanen dan akan digunakan untuk menyesuaikan materi dan tautan kelas Anda.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto pr-2 mb-6 space-y-6 custom-scrollbar">
                        {Object.entries(groupedRombels).map(([jenjangName, jenjangRombels]: [string, any]) => (
                            <div key={jenjangName} className="space-y-3">
                                <h3 className="font-semibold text-lg text-foreground border-b pb-2">{jenjangName}</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {jenjangRombels.map((r: any) => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => setSelectedRombel(r.id)}
                                            className={`p-3 text-sm font-medium rounded-xl border transition-all ${
                                                selectedRombel === r.id 
                                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300' 
                                                : 'bg-card border-border hover:border-blue-300 hover:bg-blue-50/50 text-foreground dark:hover:bg-blue-900/20'
                                            }`}
                                        >
                                            {r.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button
                        type="submit"
                        disabled={!selectedRombel || processing}
                        className="w-full shrink-0 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {processing ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Simpan Kelas'}
                    </button>
                </form>
            </div>
        </div>
    );
}

import jsQR from 'jsqr';

function VerificationPopup() {
    const { auth } = usePage().props as any;
    const [isOpen, setIsOpen] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeMode = auth?.user?.active_mode;
    const isMurid = activeMode?.value === 'murid' || auth?.user?.roles?.includes('murid');
    
    // Show if murid, rombel is null, and NOT verified yet
    if (!auth?.user || !isMurid || auth.user.rombel_id !== null || auth.user.is_verified || !isOpen) {
        return null;
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setErrorMsg('');
        setProcessing(true);

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) {
                    setErrorMsg('Gagal memproses gambar.');
                    setProcessing(false);
                    return;
                }
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0, img.width, img.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    if (code.data === '21d16bb852954f7') {
                        submitVerification(code.data);
                    } else {
                        setErrorMsg('QR Code tidak sesuai format Kartu Santri.');
                        setProcessing(false);
                    }
                } else {
                    setErrorMsg('Tidak dapat menemukan/membaca QR Code di gambar ini.');
                    setProcessing(false);
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const submitVerification = (qrData: string) => {
        router.post(route('siswa.profile.verify-card'), { qr_data: qrData }, {
            onSuccess: () => {
                setIsOpen(false);
                setProcessing(false);
            },
            onError: () => {
                setErrorMsg('Terjadi kesalahan saat memverifikasi di server.');
                setProcessing(false);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 relative overflow-hidden text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M3 15h6"/><path d="M3 18h6"/></svg>
                </div>
                <h2 className="text-2xl font-bold text-foreground">Verifikasi Kartu Santri</h2>
                <p className="text-sm text-muted-foreground mt-2 mb-6">
                    Silakan unggah atau foto Kartu Santri Anda untuk memverifikasi identitas sebelum memilih kelas. Pastikan QR Code terlihat jelas.
                </p>

                {errorMsg && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium border border-red-200">
                        {errorMsg}
                    </div>
                )}

                <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processing}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                    {processing ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Memproses...
                        </>
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                            Unggah Foto Kartu
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

function GlobalFlashNotification() {
    const { flash } = usePage().props as any;
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (flash?.error || flash?.success) {
            setMessage({ text: flash.error || flash.success, type: flash.error ? 'error' : 'success' });
            setVisible(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setVisible(false), 4000);
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [flash?.error, flash?.success]);

    if (!visible || !message) return null;

    const isError = message.type === 'error';
    return (
        <div
            style={{ zIndex: 99998 }}
            className={`fixed top-5 right-5 flex items-start gap-3 max-w-sm w-full px-4 py-3 rounded-xl shadow-2xl border transition-all duration-300 ${
                isError
                    ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
                    : 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200'
            }`}
        >
            <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isError
                    ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                    : <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>
                }
            </svg>
            <span className="text-sm font-medium flex-1">{message.text}</span>
            <button onClick={() => setVisible(false)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
    );
}


export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
        <ImpersonateBanner />
        <VerificationPopup />
        <RombelPopup />
        <GlobalFlashNotification />
    </AppLayoutTemplate>
);
