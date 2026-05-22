import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CalendarEventFile {
    id: number;
    name: string;
    url: string;
    description?: string;
}

interface CalendarEvent {
    id: number;
    title: string;
    description?: string;
    tempat?: string;
    start: string;
    end: string;
    realStart: string;
    realEnd: string;
    color: string;
    status: string;
    created_by: string;
    files?: CalendarEventFile[];
}

interface ModalState {
    open: boolean;
    mode: 'add' | 'edit' | 'view';
    event: CalendarEvent | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const DOW_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const GRID_ROWS = 6;
const GRID_COLS = 7;

const COLOR_PALETTE = [
    '#4285F4', '#0F9D58', '#DB4437', '#F4B400',
    '#00ACC1', '#8E24AA', '#7986CB', '#F4511E',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0');

function startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function formatDateTimeLocal(dateStr: string): string {
    if (!dateStr) return '';
    let d: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        d = new Date(dateStr + 'T00:00:00');
    } else {
        d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nowLocalString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function buildGoogleCalUrl(title: string, desc: string, location: string, start: Date, end: Date): string {
    const fmt = (d: Date) =>
        d.getUTCFullYear() +
        pad(d.getUTCMonth() + 1) +
        pad(d.getUTCDate()) + 'T' +
        pad(d.getUTCHours()) +
        pad(d.getUTCMinutes()) +
        pad(d.getUTCSeconds()) + 'Z';

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${fmt(start)}/${fmt(end)}`,
        details: desc || '',
        location: location || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ─── Swal-like Notification ───────────────────────────────────────────────────
interface ToastProps { message: string; type: 'success' | 'error' | 'info'; }

function Toast({ message, type, onClose }: ToastProps & { onClose: () => void }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3200);
        return () => clearTimeout(t);
    }, [onClose]);

    const bgClass = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
    return (
        <div className={`fixed top-5 right-5 z-[99999] ${bgClass} text-white rounded-lg px-5 py-3 font-medium shadow-lg animate-in slide-in-from-top-4 fade-in duration-300 min-w-[220px] max-w-[340px]`}>
            {message}
        </div>
    );
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────
interface Strip {
    ev: CalendarEvent;
    row: number;
    colStart: number;
    widthDays: number;
    tier: number;
}

function buildStrips(events: CalendarEvent[], gridStart: Date): Strip[] {
    const strips: Strip[] = [];
    const rowTiers: { tier: number; start: number; end: number }[][] =
        Array.from({ length: GRID_ROWS }, () => []);

    const sorted = [...events].sort((a, b) => {
        const aS = new Date(a.realStart || a.start).getTime();
        const bS = new Date(b.realStart || b.start).getTime();
        if (aS !== bS) return aS - bS;
        return new Date(b.realEnd || b.end).getTime() - new Date(a.realEnd || a.end).getTime();
    });

    sorted.forEach(ev => {
        const startDay = startOfDay(new Date(ev.realStart || ev.start));
        const endExclDay = startOfDay(new Date(ev.realEnd || ev.end));

        const msDay = 86400000;
        const startIdx = Math.floor((startDay.getTime() - gridStart.getTime()) / msDay);
        const endExclIdx = Math.floor((endExclDay.getTime() - gridStart.getTime()) / msDay);

        const spanStart = Math.max(0, startIdx);
        const spanEnd = Math.min(GRID_ROWS * GRID_COLS, Math.max(endExclIdx, startIdx + 1));

        if (spanEnd <= spanStart) return;

        let current = spanStart;
        while (current < spanEnd) {
            const row = Math.floor(current / GRID_COLS);
            if (row >= GRID_ROWS) break;
            const rowEnd = (row + 1) * GRID_COLS;
            const pieceStart = current;
            const pieceEnd = Math.min(spanEnd, rowEnd);
            const colStart = pieceStart % GRID_COLS;
            const widthDays = pieceEnd - pieceStart;

            let tier = 0;
            while (rowTiers[row].some(item =>
                item.tier === tier &&
                !(pieceEnd <= item.start || pieceStart >= item.end)
            )) { tier++; }

            rowTiers[row].push({ tier, start: pieceStart, end: pieceEnd });
            strips.push({ ev, row, colStart, widthDays, tier });
            current = pieceEnd;
        }
    });

    return strips;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminCalendar() {
    const { auth } = usePage<{ auth: { user: { name: string; roles?: { name: string }[] } } }>().props;
    const user = auth?.user;
    const isAdmin = user?.roles?.some(r => r.name === 'admin' || r.name === 'superadmin') ?? false;

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
                `/admin/calendar/events?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`,
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
                `/admin/calendar/events?start=${encodeURIComponent(today.toISOString())}&end=${encodeURIComponent(future.toISOString())}`,
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
            const res = await fetch(`/admin/calendar/files/${fileId}`, { method: 'DELETE', headers });
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
                res = await fetch('/admin/calendar/events', { method: 'POST', headers, body: formData });
            } else {
                formData.append('_method', 'PUT'); // Laravel method spoofing for PUT with FormData
                res = await fetch(`/admin/calendar/events/${modal.event!.id}`, { method: 'POST', headers, body: formData });
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
            const res = await fetch(`/admin/calendar/events/${modal.event.id}`, { method: 'DELETE', headers });
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
            { title: 'Kalender Kegiatan', href: '/admin/calendar' },
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
                                    onClick={() => openAddModal(cell.date)}
                                    className={`p-1.5 cursor-pointer transition-colors hover:bg-muted/40 ${!cell.inMonth ? 'bg-muted/30' : 'bg-card'}`}
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
            {modal.open && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeModal}>
                    <div
                        className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-muted/30">
                            <h2 className="text-xl font-normal text-foreground">
                                {modal.mode === 'add' ? (isAdmin ? 'Tambah Kegiatan' : 'Ajukan Kegiatan') : modal.mode === 'edit' ? 'Edit Kegiatan' : 'Detail Kegiatan'}
                            </h2>
                            <button type="button" onClick={closeModal} className="p-2 -mr-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                            <div className="p-6 overflow-y-auto space-y-6">
                                <div>
                                    <input
                                        type="text"
                                        required
                                        disabled={modal.mode === 'view'}
                                        value={formTitle}
                                        onChange={e => setFormTitle(e.target.value)}
                                        className="w-full text-2xl px-0 py-2 bg-transparent border-0 border-b-2 border-transparent focus:border-primary text-foreground placeholder:text-muted-foreground/60 focus:ring-0 disabled:opacity-90 disabled:bg-transparent"
                                        placeholder="Tambahkan judul"
                                        autoFocus={modal.mode !== 'view'}
                                    />
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-5 pt-2 text-muted-foreground flex justify-center">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Mulai</label>
                                            <input
                                                type="datetime-local"
                                                required
                                                disabled={modal.mode === 'view'}
                                                value={formStart}
                                                onChange={e => setFormStart(e.target.value)}
                                                className="w-full px-3 py-2 bg-muted/50 border-0 rounded-md text-foreground focus:ring-2 focus:ring-primary/20 disabled:opacity-75"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Selesai</label>
                                            <input
                                                type="datetime-local"
                                                required
                                                disabled={modal.mode === 'view'}
                                                value={formEnd}
                                                onChange={e => setFormEnd(e.target.value)}
                                                className="w-full px-3 py-2 bg-muted/50 border-0 rounded-md text-foreground focus:ring-2 focus:ring-primary/20 disabled:opacity-75"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-5 pt-2 text-muted-foreground flex justify-center">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            disabled={modal.mode === 'view'}
                                            value={formLocation}
                                            onChange={e => setFormLocation(e.target.value)}
                                            className="w-full px-3 py-2 bg-muted/50 border-0 rounded-md text-foreground focus:ring-2 focus:ring-primary/20 disabled:opacity-75"
                                            placeholder="Tambahkan lokasi"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-5 pt-2 text-muted-foreground flex justify-center">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            rows={3}
                                            disabled={modal.mode === 'view'}
                                            value={formDesc}
                                            onChange={e => setFormDesc(e.target.value)}
                                            className="w-full px-3 py-2 bg-muted/50 border-0 rounded-md text-foreground focus:ring-2 focus:ring-primary/20 disabled:opacity-75 resize-y"
                                            placeholder="Tambahkan deskripsi"
                                        />
                                    </div>
                                </div>

                                {/* FILE UPLOADS SECTION */}
                                <div className="flex items-start gap-4">
                                    <div className="w-5 pt-2 text-muted-foreground flex justify-center">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                                    </div>
                                    <div className="flex-1">
                                        {/* Existing Files */}
                                        {modal.event?.files && modal.event.files.length > 0 && (
                                            <div className="mb-4 space-y-2">
                                                <h3 className="text-sm font-semibold text-foreground">File Terlampir</h3>
                                                {modal.event.files.map(file => (
                                                    <div key={file.id} className="flex items-start gap-3 p-3 bg-muted/30 border border-border rounded-lg group">
                                                        <a href={file.url} target="_blank" rel="noreferrer" className="flex items-center justify-center p-2 bg-primary/10 rounded-md text-primary shrink-0 transition-colors hover:bg-primary/20">
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                                                        </a>
                                                        <div className="flex-1 min-w-0">
                                                            <a href={file.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate block">
                                                                {file.name}
                                                            </a>
                                                            {file.description && <p className="text-xs text-muted-foreground mt-1 break-words">{file.description}</p>}
                                                        </div>
                                                        {isAdmin && modal.mode === 'edit' && (
                                                            <button type="button" onClick={() => deleteExistingFile(file.id)} className="p-1.5 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* New File Uploads */}
                                        {modal.mode !== 'view' && (
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-semibold text-foreground">Lampirkan File Baru</h3>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="file" 
                                                        multiple 
                                                        ref={fileInputRef}
                                                        onChange={handleFileSelect}
                                                        className="hidden" 
                                                        id="file-upload" 
                                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
                                                    />
                                                    <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 border border-border rounded-md transition-colors">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                                        Pilih File
                                                    </label>
                                                    <span className="text-xs text-muted-foreground">Max 10MB per file</span>
                                                </div>

                                                {formFiles.length > 0 && (
                                                    <div className="space-y-3 mt-3">
                                                        {formFiles.map((file, index) => (
                                                            <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 bg-muted/20 border border-border rounded-lg relative">
                                                                <button type="button" onClick={() => handleRemoveNewFile(index)} className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow-sm hover:scale-110 transition-transform">
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                                </button>
                                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                                    <span className="text-sm font-medium truncate text-foreground flex items-center gap-2">
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground shrink-0"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                                                                        <span className="truncate">{file.name}</span>
                                                                    </span>
                                                                    <span className="text-[10px] text-muted-foreground ml-6">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                                </div>
                                                                <div className="flex-[2]">
                                                                    <input
                                                                        type="text"
                                                                        value={formFileDescriptions[index]}
                                                                        onChange={e => updateFileDescription(index, e.target.value)}
                                                                        placeholder="Deskripsi file (opsional)"
                                                                        className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-md focus:ring-1 focus:ring-primary"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {modal.mode !== 'view' && (
                                    <div className="flex items-start gap-4 pt-2">
                                        <div className="w-5 pt-2 text-muted-foreground flex justify-center">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
                                        </div>
                                        <div className="flex-1 flex flex-wrap gap-3">
                                            {COLOR_PALETTE.map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setFormColor(c)}
                                                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${formColor === c ? 'ring-2 ring-offset-2 ring-offset-card ring-primary' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                >
                                                    {formColor === c && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {modal.event && (
                                    <div className="flex items-start gap-4">
                                        <div className="w-5 text-muted-foreground flex justify-center">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        </div>
                                        <div className="flex-1 text-xs text-muted-foreground pt-0.5">
                                            Dibuat oleh: <span className="font-medium text-foreground">{modal.event.created_by}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex flex-col-reverse sm:flex-row items-center justify-between px-6 py-4 gap-4 bg-muted/10 border-t border-border">
                                <div>
                                    {/* Google Calendar Link - Available when there's an event (view/edit mode) */}
                                    {modal.event && (
                                        <a
                                            href={buildGoogleCalUrl(
                                                modal.event.title,
                                                modal.event.description ?? '',
                                                modal.event.tempat ?? '',
                                                new Date(modal.event.realStart || modal.event.start),
                                                new Date(modal.event.realEnd || modal.event.end),
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-md transition-colors"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                            Tambah ke Google Calendar
                                        </a>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                    {isAdmin && modal.mode === 'edit' && (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                        >
                                            Hapus
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                                    >
                                        Batal
                                    </button>
                                    {modal.mode !== 'view' && (
                                        <button
                                            type="submit"
                                            disabled={formSaving}
                                            className="px-6 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            {formSaving ? 'Menyimpan...' : 'Simpan'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
