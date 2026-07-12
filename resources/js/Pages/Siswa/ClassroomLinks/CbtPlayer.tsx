import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { Maximize, AlertOctagon, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import axios from 'axios';

interface CbtPlayerProps {
    exam: {
        id: number;
        type: string;
        mapel: string;
        url: string;
        session_id: number;
        violation_count: number;
        started_at?: string;
        durasi?: number | null;
    }
}

export default function CbtPlayer({ exam }: CbtPlayerProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [violationCount, setViolationCount] = useState(exam.violation_count);
    const [status, setStatus] = useState(exam.violation_count >= 3 ? 'blocked' : 'active');
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!exam.started_at || !exam.durasi || status !== 'active') return;

        // Note: exam.started_at is usually in UTC from Laravel timestamp, but if it comes as local string, JS date parser handles it.
        // It's safer to treat it as UTC if it comes with 'Z', or we assume server and client are in the same zone if no timezone provided.
        // If Laravel returns 'Y-m-d H:i:s', new Date('Y-m-d H:i:s') parses it in local time. 
        // We'll append 'Z' to force UTC if it's not present and it's an ISO string, but Inertia usually serializes timestamps as ISO.
        const d = new Date(exam.started_at);
        // Let's assume Inertia returns ISO 8601 strings.
        const startTime = d.getTime();
        const endTime = startTime + exam.durasi * 60000;

        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = Math.max(0, endTime - now);
            setTimeLeft(diff);

            if (diff <= 0) {
                // Auto finish
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                }
                router.post(route('siswa.exam.finish', { link: exam.id, type: exam.type }), {}, {
                    onSuccess: () => alert("Waktu ujian Anda telah habis!")
                });
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [exam.started_at, exam.durasi, status, exam.id, exam.type]);

    const formatTime = (ms: number | null) => {
        if (ms === null) return null;
        const totalSeconds = Math.floor(ms / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const requestFullscreen = async () => {
        try {
            if (containerRef.current) {
                if (containerRef.current.requestFullscreen) {
                    await containerRef.current.requestFullscreen();
                } else if ((containerRef.current as any).webkitRequestFullscreen) {
                    await (containerRef.current as any).webkitRequestFullscreen();
                } else if ((containerRef.current as any).msRequestFullscreen) {
                    await (containerRef.current as any).msRequestFullscreen();
                }
                setIsFullscreen(true);
                setHasStarted(true);
            }
        } catch (err) {
            console.error("Gagal memasuki mode layar penuh:", err);
            alert("Gagal memasuki mode layar penuh. Pastikan browser Anda mengizinkannya.");
        }
    };

    const reportViolation = async () => {
        if (status === 'blocked') return;

        try {
            const res = await axios.post(route('siswa.exam.violation', { link: exam.id, type: exam.type }));
            setViolationCount(res.data.violation_count);
            setStatus(res.data.status);
        } catch (error) {
            console.error("Gagal melaporkan pelanggaran", error);
        }
    };

    const handleFinish = () => {
        if(confirm("Apakah Anda yakin sudah selesai mengerjakan ujian?")) {
            router.post(route('siswa.exam.finish', { link: exam.id, type: exam.type }));
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && hasStarted) {
                setIsFullscreen(false);
                reportViolation();
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden && hasStarted && isFullscreen) {
                reportViolation();
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Prevent context menu and keyboard shortcuts (basic protection)
        const preventDevTools = (e: KeyboardEvent) => {
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                (e.ctrlKey && e.key === 'U')
            ) {
                e.preventDefault();
            }
        };
        
        const preventContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        window.addEventListener('keydown', preventDevTools);
        window.addEventListener('contextmenu', preventContextMenu);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('keydown', preventDevTools);
            window.removeEventListener('contextmenu', preventContextMenu);
        };
    }, [hasStarted, isFullscreen, status]);

    // Update state periodically to check if teacher unblocked
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'blocked') {
            interval = setInterval(async () => {
                try {
                    // Cek status dengan me-reload data dari server secara diam-diam
                    const res = await axios.get(route('siswa.exam.play', { link: exam.id, type: exam.type }), {
                        headers: {
                            'X-Inertia': 'true',
                            'X-Inertia-Version': ''
                        }
                    });
                    
                    const newProps = res.data.props;
                    if(newProps.exam && newProps.exam.violation_count < 3) {
                        setViolationCount(newProps.exam.violation_count);
                        setStatus('active');
                        alert("Pengawas telah mereset status Anda. Silakan mulai kembali.");
                        setHasStarted(false); // require starting fullscreen again
                    }
                } catch(e) {}
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [status, exam.id, exam.type]);

    return (
        <div ref={containerRef} className="bg-white min-h-screen w-full flex flex-col relative font-sans">
            <Head title={`Ujian ${exam.type.toUpperCase()} - ${exam.mapel}`} />

            {/* Jika Terblokir */}
            {status === 'blocked' && (
                <div className="absolute inset-0 z-50 bg-red-50 flex flex-col items-center justify-center p-6 text-center">
                    <ShieldAlert className="w-24 h-24 text-red-600 mb-6" />
                    <h1 className="text-4xl font-bold text-red-700 mb-4">Ujian Diblokir</h1>
                    <p className="text-lg text-red-600 max-w-xl mb-6">
                        Anda telah keluar dari mode layar penuh atau berpindah tab sebanyak 3 kali. 
                        Ujian Anda dikunci karena indikasi pelanggaran.
                    </p>
                    <p className="text-md text-red-500 font-medium bg-red-100 px-6 py-3 rounded-xl border border-red-200">
                        Menunggu Guru Pengawas untuk membuka kembali akses Anda...
                    </p>
                    <button 
                        onClick={() => window.location.href = route('siswa.classroom-links.index')}
                        className="mt-8 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
                    >
                        Kembali ke Daftar Kelas
                    </button>
                </div>
            )}

            {/* Sebelum Memulai (Harus klik tombol untuk layar penuh) */}
            {!hasStarted && status !== 'blocked' && (
                <div className="absolute inset-0 z-40 bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-white p-10 rounded-3xl shadow-xl max-w-2xl w-full">
                        <Maximize className="w-20 h-20 text-blue-600 mx-auto mb-6" />
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Mulai Ujian {exam.type.toUpperCase()}</h2>
                        <h3 className="text-xl text-gray-600 font-medium mb-8">{exam.mapel}</h3>
                        
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 text-left">
                            <h4 className="flex items-center gap-2 font-bold text-amber-800 mb-2">
                                <AlertOctagon className="w-5 h-5" /> Aturan Ujian CBT:
                            </h4>
                            <ul className="list-disc pl-5 text-amber-700 space-y-2">
                                <li>Ujian <strong>wajib</strong> dikerjakan dalam mode layar penuh (Full Screen).</li>
                                <li>Dilarang keluar layar penuh, menekan tombol ESC, atau membuka tab/aplikasi lain.</li>
                                <li>Sistem mencatat setiap pelanggaran. Pelanggaran ke-3 akan <strong>memblokir otomatis</strong> ujian Anda.</li>
                                <li>Saat ini Anda memiliki <strong>{violationCount}</strong> catatan pelanggaran.</li>
                            </ul>
                        </div>

                        <button 
                            onClick={requestFullscreen}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                        >
                            Saya Mengerti & Mulai Ujian
                        </button>
                        
                        <button 
                            onClick={() => window.location.href = route('siswa.classroom-links.index')}
                            className="mt-4 text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Kembali
                        </button>
                    </div>
                </div>
            )}

            {/* Sedang Ujian (Iframe + Header) */}
            {hasStarted && isFullscreen && status !== 'blocked' && (
                <div className="flex flex-col h-screen w-full bg-gray-50 overflow-hidden">
                    {/* Safe Header */}
                    <header className="bg-white border-b shadow-sm py-3 px-6 flex justify-between items-center z-10 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md font-bold text-sm">
                                {exam.type.toUpperCase()}
                            </div>
                            <h1 className="font-semibold text-gray-800">{exam.mapel}</h1>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            {timeLeft !== null && exam.durasi && (
                                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold border ${timeLeft < 300000 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                    <Clock className="w-4 h-4" />
                                    {formatTime(timeLeft)}
                                </div>
                            )}

                            {violationCount > 0 && (
                                <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-semibold animate-pulse">
                                    <AlertOctagon className="w-4 h-4" />
                                    Pelanggaran: {violationCount} / 3
                                </div>
                            )}
                            
                            <button 
                                onClick={handleFinish}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Selesai Ujian
                            </button>
                        </div>
                    </header>

                    {/* Iframe Google Form */}
                    <div className="flex-1 w-full bg-white relative">
                        <iframe 
                            src={
                                exam.url.includes('docs.google.com/forms') 
                                ? (exam.url.includes('?') ? exam.url + '&embedded=true' : exam.url + '?embedded=true')
                                : exam.url
                            }
                            className="absolute inset-0 w-full h-full border-0"
                            allow="camera; microphone"
                            title="Google Form Ujian"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
