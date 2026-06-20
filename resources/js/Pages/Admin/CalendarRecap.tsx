import React, { useState, useRef, useEffect } from 'react';
import { Head, router, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

import { CalendarEvent } from '@/types/calendar';
import { formatDateTimeLocal } from '@/lib/calendar-utils';
import Toast, { ToastProps } from '@/components/Toast';
import CalendarRecapModal from '@/components/Calendar/CalendarRecapModal';

interface Props {
    events: CalendarEvent[];
    availableYears: string[];
    currentYear: string | null;
}

export default function CalendarRecap({ events, availableYears, currentYear }: Props) {
    const { auth } = usePage<{ auth: { user: { name: string; roles?: string[]; is_admin?: boolean } } }>().props;
    const user = auth?.user;
    const isAdmin = user?.is_admin || (user?.roles?.some(r => r === 'superadmin') ?? false);

    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState<ToastProps | null>(null);

    // Upload Modal State
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formLocation, setFormLocation] = useState('');
    const [formStart, setFormStart] = useState('');
    const [formEnd, setFormEnd] = useState('');
    const [formFiles, setFormFiles] = useState<File[]>([]);
    const [formFileDescriptions, setFormFileDescriptions] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (message: string, type: ToastProps['type'] = 'success') =>
        setToast({ message, type });

    const handleYearFilter = (year: string | null) => {
        router.get('/calendar/recap', year ? { year } : {}, { preserveState: true, preserveScroll: true });
    };

    const filteredEvents = events.filter(ev => 
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ev.location && ev.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Edit Helpers
    const openEditModal = (ev: CalendarEvent) => {
        setSelectedEvent(ev);
        setFormTitle(ev.title);
        setFormDesc(ev.description ?? '');
        setFormLocation(ev.location ?? '');
        setFormStart(formatDateTimeLocal(ev.start_at));
        setFormEnd(formatDateTimeLocal(ev.end_at));
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
        if (!selectedEvent) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('title', formTitle);
        formData.append('description', formDesc);
        formData.append('location', formLocation);
        formData.append('start', formStart);
        formData.append('end', formEnd);

        formFiles.forEach((file, index) => {
            formData.append('files[]', file);
            formData.append('file_descriptions[]', formFileDescriptions[index] || '');
        });

        try {
            const res = await fetch(`/calendar/events/${selectedEvent.id}`, {
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
                showToast(data.message ?? 'Gagal menyimpan perubahan.', 'error');
            }
        } catch {
            showToast('Terjadi kesalahan koneksi.', 'error');
        } finally {
            setUploading(false);
        }
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
                if (selectedEvent && selectedEvent.files) {
                    const updatedFiles = selectedEvent.files.filter(f => f.id !== fileId);
                    setSelectedEvent({ ...selectedEvent, files: updatedFiles });
                }
                router.reload({ only: ['events'], preserveScroll: true });
            } else {
                showToast(data.message ?? 'Gagal menghapus file.', 'error');
            }
        } catch {
            showToast('Terjadi kesalahan koneksi saat menghapus file.', 'error');
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Admin Dashboard', href: '/admin/dashboard' },
            { title: 'Kalender Kegiatan', href: '/calendar' },
            { title: 'Rekapan Kegiatan', href: '/calendar/recap' },
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
                        href="/calendar"
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
                                                        href={`/calendar?date=${ev.start_at.split(' ')[0]}`}
                                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-md hover:bg-primary/20 transition-colors"
                                                        title="Lihat jadwal ini di Kalender"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                        Kalender
                                                    </Link>
                                                    <button
                                                        onClick={() => openEditModal(ev)}
                                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-muted border border-border rounded-md hover:bg-muted/80 transition-colors"
                                                        title="Edit Kegiatan & Upload File"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                                        Edit
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
            <CalendarRecapModal
                open={uploadModalOpen}
                isAdmin={isAdmin}
                selectedEvent={selectedEvent}
                closeUploadModal={closeUploadModal}
                handleUploadSubmit={handleUploadSubmit}
                deleteExistingFile={deleteExistingFile}
                formTitle={formTitle} setFormTitle={setFormTitle}
                formStart={formStart} setFormStart={setFormStart}
                formEnd={formEnd} setFormEnd={setFormEnd}
                formLocation={formLocation} setFormLocation={setFormLocation}
                formDesc={formDesc} setFormDesc={setFormDesc}
                formFiles={formFiles}
                fileInputRef={fileInputRef}
                handleFileSelect={handleFileSelect}
                handleRemoveNewFile={handleRemoveNewFile}
                formFileDescriptions={formFileDescriptions}
                updateFileDescription={updateFileDescription}
                uploading={uploading}
            />
        </AppLayout>
    );
}
