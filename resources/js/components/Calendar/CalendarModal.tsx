import React from 'react';
import { ModalState } from '@/types/calendar';
import { COLOR_PALETTE, buildGoogleCalUrl } from '@/lib/calendar-utils';

interface CalendarModalProps {
    modal: ModalState;
    isAdmin: boolean;
    closeModal: () => void;
    handleSubmit: (e: React.FormEvent) => void;
    handleDelete: () => void;
    deleteExistingFile: (fileId: number) => void;
    
    formTitle: string; setFormTitle: (v: string) => void;
    formStart: string; setFormStart: (v: string) => void;
    formEnd: string; setFormEnd: (v: string) => void;
    formLocation: string; setFormLocation: (v: string) => void;
    formDesc: string; setFormDesc: (v: string) => void;
    formColor: string; setFormColor: (v: string) => void;
    
    formFiles: File[];
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemoveNewFile: (index: number) => void;
    formFileDescriptions: string[];
    updateFileDescription: (index: number, desc: string) => void;
    
    formSaving: boolean;
}

export default function CalendarModal({
    modal, isAdmin, closeModal, handleSubmit, handleDelete, deleteExistingFile,
    formTitle, setFormTitle, formStart, setFormStart, formEnd, setFormEnd,
    formLocation, setFormLocation, formDesc, setFormDesc, formColor, setFormColor,
    formFiles, fileInputRef, handleFileSelect, handleRemoveNewFile,
    formFileDescriptions, updateFileDescription, formSaving
}: CalendarModalProps) {
    if (!modal.open) return null;

    return (
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
                                        modal.event.tempat ?? modal.event.location ?? '',
                                        new Date(modal.event.realStart || modal.event.start || modal.event.start_at || ''),
                                        new Date(modal.event.realEnd || modal.event.end || modal.event.end_at || ''),
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
    );
}
