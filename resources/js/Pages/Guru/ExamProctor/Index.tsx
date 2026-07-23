import React, { useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { AlertOctagon, CheckCircle2, ShieldAlert, Unlock, RefreshCw, Filter, Layers, School } from 'lucide-react';

interface ExamSession {
    id: number;
    exam_type: string;
    status: string;
    violation_count: number;
    started_at: string;
    finished_at: string | null;
    user: {
        id: number;
        name: string;
    };
    classroom_link: {
        id: number;
        mapel: string;
        rombel: {
            id: number;
            name: string;
        };
    };
}

interface Jenjang {
    id: number;
    nama: string;
}

interface Rombel {
    id: number;
    name: string;
    jenjang_id: number | null;
}

interface Props {
    sessions: ExamSession[];
    jenjangs: Jenjang[];
    rombels: Rombel[];
    filters: {
        jenjang_id: string | null;
        rombel_id: string | null;
    };
}

export default function Index({ sessions, jenjangs, rombels, filters }: Props) {
    
    // Auto-refresh data every 10 seconds to monitor students
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['sessions'] });
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleUnlock = (sessionId: number) => {
        if (confirm("Izinkan siswa ini untuk mengerjakan ujian kembali?")) {
            router.post(route('guru.exam-proctor.unlock', sessionId));
        }
    };

    const handleFilterChange = (key: 'jenjang_id' | 'rombel_id', value: string) => {
        router.get(
            route('guru.exam-proctor.index'),
            {
                ...filters,
                [key]: value || null,
                // Jika jenjang berubah, reset rombel
                ...(key === 'jenjang_id' ? { rombel_id: null } : {})
            },
            { preserveState: true, replace: true }
        );
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Penjaga Ujian (Proctor)', href: route('guru.exam-proctor.index') },
        ]}>
            <Head title="Penjaga Ujian (Proctor)" />

            <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Penjaga Ujian CBT</h1>
                        <p className="text-gray-500">
                            Pantau status ujian siswa secara langsung. Data dimuat ulang otomatis setiap 10 detik.
                        </p>
                    </div>
                    <button 
                        onClick={() => router.reload({ only: ['sessions'] })}
                        className="flex items-center gap-2 px-4 py-2 bg-white border shadow-sm rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh Manual
                    </button>
                </div>
                
                {/* ── Filter ── */}
                <div className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-2xl shadow-sm border border-blue-100/50 mb-6">
                    <div className="flex items-center gap-2 mb-4 text-blue-800">
                        <Filter className="w-4 h-4" />
                        <h2 className="text-sm font-bold uppercase tracking-wider">Filter Data</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-5">
                        <div className="flex-1">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-1.5 ml-1">
                                <Layers className="w-3.5 h-3.5" /> Jenjang
                            </label>
                            <select
                                value={filters.jenjang_id || ''}
                                onChange={(e) => handleFilterChange('jenjang_id', e.target.value)}
                                className="w-full bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl shadow-sm text-sm py-2.5 transition-all duration-200 hover:border-blue-300 cursor-pointer"
                            >
                                <option value="">Semua Jenjang</option>
                                {jenjangs.map((j) => (
                                    <option key={j.id} value={j.id}>{j.nama}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-1.5 ml-1">
                                <School className="w-3.5 h-3.5" /> Kelas
                            </label>
                            <select
                                value={filters.rombel_id || ''}
                                onChange={(e) => handleFilterChange('rombel_id', e.target.value)}
                                className="w-full bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl shadow-sm text-sm py-2.5 transition-all duration-200 hover:border-blue-300 cursor-pointer"
                            >
                                <option value="">Semua Kelas</option>
                                {rombels.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                                <tr>
                                    <th className="px-6 py-4">Siswa</th>
                                    <th className="px-6 py-4">Kelas & Mapel</th>
                                    <th className="px-6 py-4">Jenis Ujian</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Pelanggaran</th>
                                    <th className="px-6 py-4">Waktu Mulai</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {sessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                            Belum ada siswa yang memulai ujian.
                                        </td>
                                    </tr>
                                ) : (
                                    sessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{session.user.name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-900 font-medium">{session.classroom_link.rombel?.name}</div>
                                                <div className="text-gray-500 text-xs">{session.classroom_link.mapel}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="uppercase font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                                    {session.exam_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {session.status === 'active' && (
                                                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full font-medium">
                                                        <CheckCircle2 className="w-4 h-4" /> Aktif
                                                    </span>
                                                )}
                                                {session.status === 'blocked' && (
                                                    <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-3 py-1 rounded-full font-medium animate-pulse">
                                                        <ShieldAlert className="w-4 h-4" /> Terblokir
                                                    </span>
                                                )}
                                                {session.status === 'finished' && (
                                                    <span className="inline-flex items-center gap-1 text-gray-700 bg-gray-200 px-3 py-1 rounded-full font-medium">
                                                        <CheckCircle2 className="w-4 h-4" /> Selesai
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={`font-bold ${session.violation_count >= 3 ? 'text-red-600' : session.violation_count > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                                                    {session.violation_count} kali
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {new Date(session.started_at).toLocaleString('id-ID', {
                                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {session.status === 'blocked' && (
                                                    <button
                                                        onClick={() => handleUnlock(session.id)}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                                                    >
                                                        <Unlock className="w-4 h-4" /> Buka Akses
                                                    </button>
                                                )}
                                                {session.status === 'finished' && (
                                                    <button
                                                        onClick={() => handleUnlock(session.id)}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                                                    >
                                                        <RefreshCw className="w-4 h-4" /> Ulangi Ujian
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
