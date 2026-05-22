import React, { useState, useRef, useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

interface CalendarEventFile {
    id: number;
    name: string;
    url: string;
}

interface CalendarEvent {
    id: number;
    title: string;
    description: string | null;
    location: string | null;
    start_at: string;
    end_at: string;
    status: string;
    created_by: string;
    files: CalendarEventFile[];
}

interface Props {
    events: CalendarEvent[];
    availableYears: string[];
    currentYear: string | null;
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

export default function CalendarRecap({ events, availableYears, currentYear }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState<ToastProps | null>(null);

    // Upload Modal State
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [formFiles, setFormFiles] = useState<File[]>([]);
    const [formFileDescriptions, setFormFileDescriptions] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (message: string, type: ToastProps['type'] = 'success') =>
        setToast({ message, type });

    const handleYearFilter = (year: string | null) => {
        router.get('/admin/calendar/recap', year ? { year } : {}, { preserveState: true, preserveScroll: true });
    };

    const filteredEvents = events.filter(ev => 
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ev.location && ev.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // File Upload Helpers
    const openUploadModal = (ev: CalendarEvent) => {
        setSelectedEvent(ev);
        setFormFiles([]);
        setFormFileDescriptions([]);
        setUploadModalOpen(true);
    };

    const closeUploadModal = () => {
        setUploadModalOpen(false);
        setSelectedEvent(null);
    };

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

    const getCsrfToken = () => (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEvent || formFiles.length === 0) return;

        setUploading(true);
        const formData = new FormData();
        formFiles.forEach((file, index) => {
            formData.append('files[]', file);
            formData.append('file_descriptions[]', formFileDescriptions[index] || '');
        });

        try {
            const res = await fetch(`/admin/calendar/events/${selectedEvent.id}/files`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                showToast(data.message, 'success');
                closeUploadModal();
                router.reload({ only: ['events'], preserveScroll: true });
            } else {
                showToast(data.message ?? 'Gagal mengunggah file.', 'error');
            }
        } catch {
            showToast('Terjadi kesalahan koneksi.', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Admin Dashboard', href: '/admin/dashboard' },
            { title: 'Kalender Kegiatan', href: '/admin/calendar' },
            { title: 'Rekapan Kegiatan', href: '/admin/calendar/recap' },
        ]}>
            <Head title="Rekapan Kegiatan" />
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg>
                            Rekapan Kegiatan
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">Daftar seluruh kegiatan dan file terlampir yang pernah diajukan atau dibuat.</p>
                    </div>
                    <Link
                        href="/admin/calendar"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted transition-colors shadow-sm shrink-0"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        Lihat Kalender Utama
                    </Link>
                </div>

                {/* Filter Tabs & Search */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 border-b border-border">
                    <div className="flex gap-2 overflow-x-auto pb-[1px] w-full sm:w-auto">
                        <button
                            onClick={() => handleYearFilter(null)}
                            className={`px-4 py-2 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${!currentYear ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        >
                            Semua Tahun
                        </button>
                        {availableYears.map(year => (
                            <button
                                key={year}
                                onClick={() => handleYearFilter(year)}
                                className={`px-4 py-2 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${currentYear === year ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-64 pb-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input
                            type="text"
                            placeholder="Cari kegiatan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-md focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Tanggal Mulai</th>
                                    <th className="px-6 py-4 font-medium">Nama Kegiatan</th>
                                    <th className="px-6 py-4 font-medium">Lokasi</th>
                                    <th className="px-6 py-4 font-medium">Pembuat</th>
                                    <th className="px-6 py-4 font-medium text-center">Lampiran</th>
                                    <th className="px-6 py-4 font-medium text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredEvents.length > 0 ? (
                                    filteredEvents.map(ev => (
                                        <tr key={ev.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-foreground">{new Date(ev.start_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                                <div className="text-xs text-muted-foreground">{new Date(ev.start_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-foreground">{ev.title}</div>
                                                {ev.description && (
                                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2" title={ev.description}>
                                                        {ev.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-foreground">
                                                {ev.location || <span className="text-muted-foreground italic">-</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-foreground">
                                                {ev.created_by}
                                            </td>
                                            <td className="px-6 py-4">
                                                {ev.files.length > 0 ? (
                                                    <div className="flex flex-col gap-1.5 items-center">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                                                            {ev.files.length} File
                                                        </span>
                                                        <div className="flex flex-col w-full max-w-[200px] mt-1">
                                                            {ev.files.map((file, i) => (
                                                                <a 
                                                                    key={file.id} 
                                                                    href={file.url} 
                                                                    target="_blank" 
                                                                    rel="noreferrer"
                                                                    className="text-xs text-primary hover:underline truncate"
                                                                    title={file.name}
                                                                >
                                                                    {i + 1}. {file.name}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-muted-foreground text-xs italic">-</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={`/admin/calendar?date=${ev.start_at.split(' ')[0]}`}
                                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-md hover:bg-primary/20 transition-colors"
                                                        title="Lihat jadwal ini di Kalender"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                        Kalender
                                                    </Link>
                                                    <button
                                                        onClick={() => openUploadModal(ev)}
                                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-muted border border-border rounded-md hover:bg-muted/80 transition-colors"
                                                        title="Upload File Tambahan"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                                        Upload
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                            Tidak ada kegiatan ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            {uploadModalOpen && selectedEvent && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeUploadModal}>
                    <div
                        className="w-full max-w-lg bg-card rounded-xl shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-b border-border">
                            <h2 className="text-lg font-medium text-foreground">Upload File Tambahan</h2>
                            <button type="button" onClick={closeUploadModal} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="flex flex-col p-6">
                            <div className="mb-6">
                                <p className="text-sm font-medium text-foreground mb-1">{selectedEvent.title}</p>
                                <p className="text-xs text-muted-foreground">{new Date(selectedEvent.start_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="file" 
                                        multiple 
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        className="hidden" 
                                        id="recap-file-upload" 
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
                                    />
                                    <label htmlFor="recap-file-upload" className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 border border-border rounded-md transition-colors w-full border-dashed">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                        Pilih File (Max 10MB)
                                    </label>
                                </div>

                                {formFiles.length > 0 && (
                                    <div className="space-y-3 mt-4 max-h-48 overflow-y-auto pr-1">
                                        {formFiles.map((file, index) => (
                                            <div key={index} className="flex flex-col gap-2 p-3 bg-muted/20 border border-border rounded-lg relative">
                                                <button type="button" onClick={() => handleRemoveNewFile(index)} className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow-sm hover:scale-110 transition-transform">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground shrink-0"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                                                    <span className="text-sm font-medium truncate text-foreground flex-1">{file.name}</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formFileDescriptions[index]}
                                                    onChange={e => updateFileDescription(index, e.target.value)}
                                                    placeholder="Deskripsi file (opsional)"
                                                    className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-md focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-auto">
                                <button type="button" onClick={closeUploadModal} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors">
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading || formFiles.length === 0}
                                    className="px-6 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-70 shadow-sm"
                                >
                                    {uploading ? 'Mengunggah...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
