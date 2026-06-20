import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

import { CalendarEvent, ModalState } from '@/types/calendar';
import { MONTH_NAMES, DOW_NAMES, GRID_ROWS, GRID_COLS, COLOR_PALETTE, startOfDay, addDays, formatDateTimeLocal, nowLocalString, buildGoogleCalUrl, buildStrips, pad } from '@/lib/calendar-utils';
import Toast, { ToastProps } from '@/components/Toast';
import CalendarModal from '@/components/Calendar/CalendarModal';

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminCalendar() {
    const { auth } = usePage<{ auth: { user: { name: string; roles?: string[]; is_admin?: boolean } } }>().props;
    const user = auth?.user;
    const isAdmin = user?.is_admin || (user?.roles?.some(r => r === 'superadmin') ?? false);
    const isMurid = user?.roles?.includes('murid') ?? false;
    const isGuru = user?.roles?.includes('guru') ?? false;
    const canSubmit = isAdmin || isGuru;

    // ── Calendar state ──
    const [viewDate, setViewDate] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const initialDateStr = params.get('date');
            if (initialDateStr) {
                const d = new Date(initialDateStr);
                if (!isNaN(d.getTime())) return d;
            }
        }
        return new Date();
    });
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [upcoming, setUpcoming] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);

    // ── Modal state ──
    const [modal, setModal] = useState<ModalState>({ open: false, mode: 'add', event: null });
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formLocation, setFormLocation] = useState('');
    const [formStart, setFormStart] = useState('');
    const [formEnd, setFormEnd] = useState('');
    const [formColor, setFormColor] = useState(COLOR_PALETTE[0]);
    const [formSaving, setFormSaving] = useState(false);
    
    // File upload states
    const [formFiles, setFormFiles] = useState<File[]>([]);
    const [formFileDescriptions, setFormFileDescriptions] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Toast ──
    const [toast, setToast] = useState<ToastProps | null>(null);
    const showToast = (message: string, type: ToastProps['type'] = 'success') =>
        setToast({ message, type });

    // ── Grid helpers ──
    const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    const jsDay = monthStart.getDay();
    const mondayOffset = (jsDay + 6) % 7;
    const gridStart = addDays(startOfDay(monthStart), -mondayOffset);

    // ── Fetch events ──
    const fetchEvents = useCallback(async (start: Date, end: Date) => {
        setLoading(true);
        try {
            const res = await fetch(
                `/calendar/events?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`,
                { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
            );
            const data: CalendarEvent[] = await res.json();
            setEvents(data);
        } catch {
            showToast('Gagal memuat kegiatan.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUpcoming = useCallback(async () => {
        const today = new Date();
        const future = addDays(today, 30);
        try {
            const res = await fetch(
                `/calendar/events?start=${encodeURIComponent(today.toISOString())}&end=${encodeURIComponent(future.toISOString())}`,
                { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
            );
            const data: CalendarEvent[] = await res.json();
            setUpcoming(data.sort((a, b) =>
                new Date(a.realStart || a.start).getTime() -
                new Date(b.realStart || b.start).getTime()
            ).slice(0, 6));
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchEvents(monthStart, monthEnd);
        fetchUpcoming();
    }, [viewDate]);

    // ── Navigation ──
    const prevMonth = () => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() - 1);
        setViewDate(d);
    };
    const nextMonth = () => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() + 1);
        setViewDate(d);
    };

    // ── Modal helpers ──
    const openAddModal = (date?: Date | any) => {
        let startStr, endStr;
        if (date instanceof Date) {
            const d = new Date(date);
            const now = new Date();
            d.setHours(now.getHours(), now.getMinutes(), 0, 0);
            startStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            
            const endD = new Date(d);
            endD.setHours(endD.getHours() + 1);
            endStr = `${endD.getFullYear()}-${pad(endD.getMonth() + 1)}-${pad(endD.getDate())}T${pad(endD.getHours())}:${pad(endD.getMinutes())}`;
        } else {
            const now = nowLocalString();
            startStr = now;
            endStr = now;
        }

        setFormTitle(''); setFormDesc(''); setFormLocation('');
        setFormStart(startStr); setFormEnd(endStr); setFormColor(COLOR_PALETTE[0]);
        setFormFiles([]); setFormFileDescriptions([]);
        setModal({ open: true, mode: 'add', event: null });
    };

    const openEventModal = (ev: CalendarEvent) => {
        setFormTitle(ev.title);
        setFormDesc(ev.description ?? '');
        setFormLocation(ev.tempat ?? '');
        setFormStart(formatDateTimeLocal(ev.realStart || ev.start));
        setFormEnd(formatDateTimeLocal(ev.realEnd || ev.end));
        setFormColor(ev.color ?? COLOR_PALETTE[0]);
        setFormFiles([]); setFormFileDescriptions([]);
        setModal({ open: true, mode: isAdmin ? 'edit' : 'view', event: ev });
    };

    const closeModal = () => setModal(m => ({ ...m, open: false }));

    // ── File Helpers ──
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);
        setFormFiles(prev => [...prev, ...newFiles]);
        setFormFileDescriptions(prev => [...prev, ...newFiles.map(() => '')]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveNewFile = (index: number) => {
        setFormFiles(prev => prev.filter((_, i) => i !== index));
        setFormFileDescriptions(prev => prev.filter((_, i) => i !== index));
    };

    const updateFileDescription = (index: number, desc: string) => {
        setFormFileDescriptions(prev => {
            const newDesc = [...prev];
            newDesc[index] = desc;
            return newDesc;
        });
    };

    const deleteExistingFile = async (fileId: number) => {
        if (!window.confirm('Hapus file ini secara permanen?')) return;
        
        const headers: Record<string, string> = {
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        };

        try {
            const res = await fetch(`/calendar/files/${fileId}`, { method: 'DELETE', headers });
            const data = await res.json();
            if (data.status === 'success') {
                showToast(data.message, 'success');
                // Update local state to hide the deleted file
                if (modal.event && modal.event.files) {
                    const updatedFiles = modal.event.files.filter(f => f.id !== fileId);
                    setModal(m => ({ ...m, event: { ...m.event!, files: updatedFiles } }));
                }
                fetchEvents(monthStart, monthEnd);
            } else {
                showToast(data.message ?? 'Gagal menghapus file.', 'error');
            }
        } catch {
            showToast('Terjadi kesalahan koneksi saat menghapus file.', 'error');
        }
    };

    // ── Submit (Add / Edit) ──
    const getCsrfToken = () => (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormSaving(true);

        const formData = new FormData();
        formData.append('title', formTitle);
        formData.append('description', formDesc);
        formData.append('location', formLocation);
        formData.append('start', formStart);
        formData.append('end', formEnd);
        formData.append('color', formColor);

        formFiles.forEach((file, index) => {
            formData.append('files[]', file);
            formData.append('file_descriptions[]', formFileDescriptions[index] || '');
        });

        // We do not set Content-Type explicitly because fetch + FormData sets boundaries automatically
        const headers: Record<string, string> = {
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        };

        try {
            let res: Response;
            if (modal.mode === 'add') {
                res = await fetch('/calendar/events', { method: 'POST', headers, body: formData });
            } else {
                formData.append('_method', 'PUT'); // Laravel method spoofing for PUT with FormData
                res = await fetch(`/calendar/events/${modal.event!.id}`, { method: 'POST', headers, body: formData });
            }
            const data = await res.json();
            if (data.status === 'success') {
                showToast(data.message, 'success');
                closeModal();
                fetchEvents(monthStart, monthEnd);
                fetchUpcoming();
            } else {
                showToast(data.message ?? 'Terjadi kesalahan.', 'error');
            }
        } catch {
            showToast('Terjadi kesalahan koneksi.', 'error');
        } finally {
            setFormSaving(false);
        }
    };

    // ── Delete ──
    const handleDelete = async () => {
        if (!modal.event) return;
        if (!window.confirm('Hapus kegiatan ini secara permanen beserta semua filenya?')) return;

        const headers: Record<string, string> = {
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        };

        try {
            const res = await fetch(`/calendar/events/${modal.event.id}`, { method: 'DELETE', headers });
            const data = await res.json();
            if (data.status === 'success') {
                showToast(data.message, 'success');
                closeModal();
                fetchEvents(monthStart, monthEnd);
                fetchUpcoming();
            } else {
                showToast(data.message ?? 'Gagal menghapus.', 'error');
            }
        } catch {
            showToast('Terjadi kesalahan koneksi.', 'error');
        }
    };

    // ── Build grid cells ──
    const today = startOfDay(new Date());
    const cells: { date: Date; inMonth: boolean; isToday: boolean }[] = [];
    for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
        const date = addDays(gridStart, i);
        cells.push({
            date,
            inMonth: date >= monthStart && date < monthEnd,
            isToday: date.getTime() === today.getTime(),
        });
    }

    // ── Build strips ──
    const strips = buildStrips(events, gridStart);

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <AppLayout breadcrumbs={[
            { title: 'Admin Dashboard', href: '/admin/dashboard' },
            { title: 'Kalender Kegiatan', href: '/calendar' },
        ]}>
            <Head title="Kalender Kegiatan" />
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            <div className="flex flex-col h-[calc(100vh-4rem)] p-4 md:p-6 bg-background text-foreground animate-in fade-in duration-500">
                {/* ── Top Navigation Bar ── */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3 sm:gap-6">
                        <h1 className="text-xl sm:text-2xl font-normal text-foreground flex items-center gap-2 hidden sm:flex">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            Kalender
                        </h1>
                        <button
                            onClick={() => setViewDate(new Date())}
                            className="px-4 py-2 border border-border rounded-md hover:bg-muted text-sm font-medium transition-colors"
                        >
                            Hari ini
                        </button>
                        <div className="flex items-center gap-1">
                            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-muted transition-colors" title="Bulan lalu">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            </button>
                            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-muted transition-colors" title="Bulan depan">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                        </div>
                        <span className="text-xl sm:text-2xl font-normal text-foreground min-w-[150px]">
                            {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </span>
                    </div>
                    <div className="flex items-center">
                        {loading && <span className="text-sm font-medium text-muted-foreground animate-pulse mr-4">Memuat...</span>}
                    </div>
                </div>

                <div className="flex flex-1 gap-6 overflow-hidden">
                    {/* ── Left Sidebar ── */}
                    <div className="hidden lg:flex flex-col w-64 shrink-0 gap-6 overflow-y-auto pr-2 pb-6">
                        {/* Create Button */}
                        {canSubmit && (
                            <button
                                onClick={openAddModal}
                                className="flex items-center gap-3 px-5 py-3 bg-card border border-border text-foreground rounded-full hover:bg-muted hover:shadow-md transition-all shadow-sm font-medium w-max group"
                            >
                                <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-105 transition-transform">
                                    <path d="M16 16V6H20V16H30V20H20V30H16V20H6V16H16Z" fill="#EA4335" />
                                    <path d="M16 16V6H20V16H30V20H20V30H16V20H6V16H16Z" fill="#4285F4" clipPath="url(#clip0_0_1)" />
                                    <path d="M16 16V6H20V16H30V20H20V30H16V20H6V16H16Z" fill="#FBBC04" clipPath="url(#clip1_0_1)" />
                                    <path d="M16 16V6H20V16H30V20H20V30H16V20H6V16H16Z" fill="#34A853" clipPath="url(#clip2_0_1)" />
                                    <defs>
                                        <clipPath id="clip0_0_1"><rect width="14" height="24" fill="white" transform="translate(16 6)" /></clipPath>
                                        <clipPath id="clip1_0_1"><rect width="24" height="14" fill="white" transform="translate(6 16)" /></clipPath>
                                        <clipPath id="clip2_0_1"><rect width="14" height="14" fill="white" transform="translate(6 20)" /></clipPath>
                                    </defs>
                                </svg>
                                <span className="text-sm font-semibold tracking-wide pr-2">
                                    {isAdmin ? 'Buat' : 'Ajukan'}
                                </span>
                            </button>
                        )}

                        {/* Mini Calendar or Upcoming Events */}
                        <div className="mt-2">
                            <h2 className="text-sm font-semibold text-muted-foreground mb-4">Mendatang</h2>
                            {upcoming.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Tidak ada kegiatan dalam 30 hari ke depan.</p>
                            ) : (
                                <div className="space-y-4">
                                    {upcoming.map(ev => {
                                        const startDt = new Date(ev.realStart || ev.start);
                                        return (
                                            <div
                                                key={ev.id}
                                                onClick={() => openEventModal(ev)}
                                                className="flex gap-3 cursor-pointer group"
                                            >
                                                <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: ev.color || '#4285F4' }} />
                                                <div>
                                                    <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{ev.title}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {startDt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · {startDt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Color Legend */}
                        <div className="mt-4">
                            <h2 className="text-sm font-semibold text-muted-foreground mb-4">Kategori Warna</h2>
                            <div className="grid grid-cols-4 gap-3">
                                {COLOR_PALETTE.map(c => (
                                    <div key={c} className="w-6 h-6 rounded-full cursor-default border border-border" style={{ backgroundColor: c }} title={c} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Main Grid ── */}
                    <div className="flex-1 flex flex-col min-w-0 bg-card border border-border rounded-xl overflow-hidden shadow-sm relative">
                        {/* Day Headers */}
                        <div className="grid grid-cols-7 border-b border-border bg-muted/10 shrink-0">
                            {DOW_NAMES.map((d, i) => (
                                <div key={d} className="py-2 text-center text-[11px] font-medium text-muted-foreground uppercase border-r border-border last:border-0">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Grid Cells */}
                        <div className="relative flex-1 grid grid-cols-7 grid-rows-6 bg-border gap-[1px]">
                            {cells.map((cell, i) => (
                                <div
                                    key={i}
                                    onClick={() => canSubmit && openAddModal(cell.date)}
                                    className={`p-1.5 ${canSubmit ? 'cursor-pointer hover:bg-muted/40' : ''} transition-colors ${!cell.inMonth ? 'bg-muted/30' : 'bg-card'}`}
                                >
                                    <div className="flex justify-center mt-1">
                                        <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium ${cell.isToday ? 'bg-primary text-primary-foreground' : (cell.inMonth ? 'text-foreground' : 'text-muted-foreground')}`}>
                                            {cell.date.getDate()}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Event Strips Overlay */}
                            <div className="absolute inset-0 pointer-events-none" style={{ paddingTop: '32px' }}>
                                {strips.map((s, idx) => {
                                    const leftPct = (s.colStart / GRID_COLS) * 100;
                                    const widthPct = (s.widthDays / GRID_COLS) * 100;
                                    const topPct = (s.row / GRID_ROWS) * 100;

                                    return (
                                        <div
                                            key={`${s.ev.id}-${idx}`}
                                            title={s.ev.title}
                                            onClick={(e) => { e.stopPropagation(); openEventModal(s.ev); }}
                                            className="absolute px-2 py-0.5 text-xs font-medium text-white truncate rounded-[4px] cursor-pointer pointer-events-auto shadow-sm hover:brightness-110 transition-all border border-black/5"
                                            style={{
                                                left: `calc(${leftPct}% + 6px)`,
                                                width: `calc(${widthPct}% - 12px)`,
                                                top: `calc(${topPct}% + ${32 + s.tier * 24}px)`,
                                                backgroundColor: s.ev.color || '#4285F4',
                                                height: '22px',
                                            }}
                                        >
                                            {s.ev.title}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Modal (Dialog) ─── */}
            <CalendarModal
                modal={modal}
                isAdmin={isAdmin}
                closeModal={closeModal}
                handleSubmit={handleSubmit}
                handleDelete={handleDelete}
                deleteExistingFile={deleteExistingFile}
                formTitle={formTitle} setFormTitle={setFormTitle}
                formStart={formStart} setFormStart={setFormStart}
                formEnd={formEnd} setFormEnd={setFormEnd}
                formLocation={formLocation} setFormLocation={setFormLocation}
                formDesc={formDesc} setFormDesc={setFormDesc}
                formColor={formColor} setFormColor={setFormColor}
                formFiles={formFiles}
                fileInputRef={fileInputRef}
                handleFileSelect={handleFileSelect}
                handleRemoveNewFile={handleRemoveNewFile}
                formFileDescriptions={formFileDescriptions}
                updateFileDescription={updateFileDescription}
                formSaving={formSaving}
            />
        </AppLayout>
    );
}
