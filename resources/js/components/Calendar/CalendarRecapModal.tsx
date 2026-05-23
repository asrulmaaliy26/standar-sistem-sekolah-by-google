import React from 'react';
import { CalendarEvent } from '@/types/calendar';

interface CalendarRecapModalProps {
    open: boolean;
    isAdmin: boolean;
    selectedEvent: CalendarEvent | null;
    closeUploadModal: () => void;
    handleUploadSubmit: (e: React.FormEvent) => void;
    deleteExistingFile: (fileId: number) => void;
    
    formTitle: string; setFormTitle: (v: string) => void;
    formStart: string; setFormStart: (v: string) => void;
    formEnd: string; setFormEnd: (v: string) => void;
    formLocation: string; setFormLocation: (v: string) => void;
    formDesc: string; setFormDesc: (v: string) => void;
    
    formFiles: File[];
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemoveNewFile: (index: number) => void;
    formFileDescriptions: string[];
    updateFileDescription: (index: number, desc: string) => void;
    
    uploading: boolean;
}

export default function CalendarRecapModal({
    open, isAdmin, selectedEvent, closeUploadModal, handleUploadSubmit, deleteExistingFile,
    formTitle, setFormTitle, formStart, setFormStart, formEnd, setFormEnd,
    formLocation, setFormLocation, formDesc, setFormDesc,
    formFiles, fileInputRef, handleFileSelect, handleRemoveNewFile,
    formFileDescriptions, updateFileDescription, uploading
}: CalendarRecapModalProps) {
    if (!open || !selectedEvent) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeUploadModal}>
            <div
                className="w-full max-w-lg bg-card rounded-xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-b border-border">
                    <h2 className="text-lg font-medium text-foreground">Edit Kegiatan</h2>
                    <button type="button" onClick={closeUploadModal} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <form onSubmit={handleUploadSubmit} className="flex flex-col max-h-[85vh]">
                    <div className="p-6 overflow-y-auto space-y-6">
                        <div>
                            <input
                                type="text"
                                required
                                value={formTitle}
                                onChange={e => setFormTitle(e.target.value)}
                                className="w-full text-xl px-0 py-2 bg-transparent border-0 border-b-2 border-transparent focus:border-primary text-foreground placeholder:text-muted-foreground/60 focus:ring-0"
                                placeholder="Judul Kegiatan"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Mulai</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formStart}
                                    onChange={e => setFormStart(e.target.value)}
                                    className="w-full px-3 py-2 bg-muted/50 border-0 rounded-md text-foreground focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Selesai</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formEnd}
                                    onChange={e => setFormEnd(e.target.value)}
                                    className="w-full px-3 py-2 bg-muted/50 border-0 rounded-md text-foreground focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <div>
                            <input
                                type="text"
                                value={formLocation}
                                onChange={e => setFormLocation(e.target.value)}
                                className="w-full px-3 py-2 bg-muted/50 border-0 rounded-md text-foreground focus:ring-2 focus:ring-primary/20"
                                placeholder="Lokasi (Opsional)"
                            />
                        </div>

                        <div>
                            <textarea
                                rows={3}
                                value={formDesc}
                                onChange={e => setFormDesc(e.target.value)}
                                className="w-full px-3 py-2 bg-muted/50 border-0 rounded-md text-foreground focus:ring-2 focus:ring-primary/20 resize-y"
                                placeholder="Deskripsi (Opsional)"
                            />
                        </div>

                        {/* FILE UPLOADS SECTION */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-foreground">File Terlampir</h3>
                            {selectedEvent.files && selectedEvent.files.length > 0 ? (
                                <div className="space-y-2 mb-4">
                                    {selectedEvent.files.map(file => (
                                        <div key={file.id} className="flex items-center gap-3 p-2 bg-muted/30 border border-border rounded-lg group">
                                            <a href={file.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline flex-1 truncate block">
                                                {file.name}
                                            </a>
                                            {isAdmin && (
                                                <button type="button" onClick={() => deleteExistingFile(file.id)} className="p-1.5 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors shrink-0">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground mb-4">Tidak ada file terlampir.</p>
                            )}
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
                    </div>

                    <div className="flex justify-end gap-3 px-6 py-4 bg-muted/20 border-t border-border">
                        <button type="button" onClick={closeUploadModal} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors">
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="px-6 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-70 shadow-sm"
                        >
                            {uploading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
