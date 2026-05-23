import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

export default function Ujian() {
    const { auth } = usePage<any>().props;
    
    const [isStarted, setIsStarted] = useState(false);
    const [warnings, setWarnings] = useState(0);
    const [violationMessage, setViolationMessage] = useState<string | null>(null);
    const [siswaInfo, setSiswaInfo] = useState<{nim?: string, nama?: string} | null>(null);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const warningsRef = useRef(0);
    const isWarningActiveRef = useRef(false);
    const siswaInfoRef = useRef<{nim?: string, nama?: string} | null>(null);

    // Sync state with ref for event listeners
    useEffect(() => {
        siswaInfoRef.current = siswaInfo;
    }, [siswaInfo]);

    const playAlarm = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            
            // Beep pattern
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.error("Audio api not supported", e);
        }
    };

    const handleViolation = (reason: string) => {
        if (isWarningActiveRef.current) return;
        
        isWarningActiveRef.current = true;
        playAlarm();
        setViolationMessage(reason);
        
        warningsRef.current += 1;
        setWarnings(warningsRef.current);

        // Gunakan auth dari aplikasi Wrapper jika siswaInfo dari Siakad tidak ada
        const finalNim = siswaInfoRef.current?.nim || auth?.user?.email || '-';
        const finalNama = siswaInfoRef.current?.nama || auth?.user?.name || '-';

        // Record violation to backend
        axios.post('/pelanggaran', {
            nim: finalNim,
            nama_siswa: finalNama,
            jenis_pelanggaran: reason,
        }).catch(err => console.error("Failed to record violation", err));
        
        if (warningsRef.current >= 5) {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(e => console.error(e));
            }
            // Add a small delay so user reads the final alert before redirect
            setTimeout(() => {
                router.visit('/');
            }, 3000);
            setViolationMessage("Batas peringatan tercapai (5/5)! Anda dikeluarkan dari ujian. Mengalihkan ke halaman awal...");
        } else {
            // Coba paksa masuk fullscreen lagi jika keluar
            if (!document.fullscreenElement && containerRef.current) {
                containerRef.current.requestFullscreen().catch(e => console.error(e));
            }
        }
    };

    const dismissWarning = () => {
        if (warningsRef.current >= 5) return; // Don't allow dismiss on final warning
        
        setViolationMessage(null);
        // Add a tiny timeout to avoid immediately re-triggering blur if focus shifts
        setTimeout(() => {
            isWarningActiveRef.current = false;
        }, 500);

        if (!document.fullscreenElement && containerRef.current) {
            containerRef.current.requestFullscreen().catch(e => console.error(e));
        }
    };

    useEffect(() => {
        if (!isStarted) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation("Anda terdeteksi menyembunyikan/berpindah tab browser!");
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                handleViolation("Anda terdeteksi keluar dari mode Layar Penuh!");
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            handleViolation("Klik kanan tidak diizinkan selama ujian!");
        };

        const handleBlur = () => {
            // Jika activeElement adalah iframe, berarti user mengklik isi ujian (aman)
            if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
                return;
            }
            handleViolation("Browser kehilangan fokus (Anda terdeteksi membuka aplikasi/jendela lain)!");
        };

        const handleMessage = (event: MessageEvent) => {
            // Uncomment the domain check in production for security!
            // if (event.origin !== 'https://siakad.staialmannan.ac.id') return;

            if (event.data && event.data.tipe === 'INFO_SISWA') {
                setSiswaInfo({
                    nim: event.data.nim,
                    nama: event.data.nama
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('message', handleMessage);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('message', handleMessage);
        };
    }, [isStarted]);

    const startUjian = async () => {
        if (containerRef.current) {
            try {
                await containerRef.current.requestFullscreen();
                setIsStarted(true);
            } catch (err) {
                alert("Harap izinkan mode Layar Penuh pada browser Anda untuk memulai ujian.");
            }
        }
    };

    return (
        <>
            <Head title="CBT Safe Exam Browser" />
            <div 
                ref={containerRef} 
                className={`w-full h-screen bg-gray-100 flex flex-col ${isStarted ? 'fixed top-0 left-0 z-50' : ''}`}
            >
                {!isStarted ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full border-t-4 border-red-600">
                            <h1 className="text-3xl font-bold mb-6 text-red-600">PERATURAN UJIAN</h1>
                            <div className="text-left text-sm text-gray-700 mb-6 space-y-3">
                                <p className="font-medium">Sistem Pengawasan Otomatis akan aktif. DILARANG:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Keluar dari mode Layar Penuh (Full Screen).</li>
                                    <li>Membuka tab baru, browser baru, atau meminimalkan browser.</li>
                                    <li>Berpindah ke aplikasi lain di komputer/HP Anda.</li>
                                    <li>Melakukan klik kanan.</li>
                                </ul>
                                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">
                                    <strong>SANKSI:</strong> Pelanggaran akan dicatat. Jika peringatan mencapai <strong>5 kali</strong>, ujian akan otomatis dihentikan dan Anda akan dikeluarkan.
                                </div>
                            </div>
                            
                            <div className="mb-6 text-left">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                                    <svg className="shrink-0 text-blue-600 mt-0.5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                                    <div>
                                        <p className="text-sm text-blue-800 font-medium">Integrasi Siakad Aktif</p>
                                        <p className="text-xs text-blue-600 mt-1">Data nama dan NIM Anda akan otomatis tercatat oleh sistem pengawas ketika Anda login ke dalam Siakad.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={startUjian}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-4 rounded-lg transition-colors text-lg"
                            >
                                SAYA MENGERTI & MULAI UJIAN
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full relative bg-white">
                        {violationMessage && (
                            <div className="absolute inset-0 bg-black/90 z-[999] flex items-center justify-center p-6">
                                <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
                                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                                    <h2 className="text-2xl font-bold text-red-600 mb-2">PELANGGARAN TERDETEKSI</h2>
                                    <p className="text-gray-800 font-medium mb-6">{violationMessage}</p>
                                    
                                    {warnings < 5 ? (
                                        <>
                                            <p className="font-bold text-lg mb-6 bg-red-100 text-red-800 p-2 rounded">
                                                Peringatan ke-{warnings} dari 5
                                            </p>
                                            <button 
                                                onClick={dismissWarning}
                                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg"
                                            >
                                                SAYA BERJANJI TIDAK MENGULANGI
                                            </button>
                                        </>
                                    ) : (
                                        <p className="font-bold text-lg mb-6 text-red-800 animate-pulse">
                                            Mohon tunggu, mengeluarkan dari sistem...
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Overlay indicator */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-white/50 flex items-center px-4 justify-between pointer-events-none z-10 opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold text-red-500 bg-white/80 px-1 rounded">Mode Pengawasan Aktif</span>
                            <span className="text-[10px] font-bold text-red-500 bg-white/80 px-1 rounded">Pelanggaran: {warnings}/5</span>
                        </div>
                        
                        <iframe
                            src="https://siakad.staialmannan.ac.id/"
                            className="w-full h-full border-none"
                            allow="camera; microphone; display-capture"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"
                        />
                    </div>
                )}
            </div>
        </>
    );
}
