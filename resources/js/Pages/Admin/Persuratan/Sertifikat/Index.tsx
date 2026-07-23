import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Rnd } from 'react-rnd';
import { PDFDocument, rgb } from 'pdf-lib';
import { Trash2, Edit, Plus, FileDown, FileText } from 'lucide-react';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Penandatangan {
    id: number;
    nama: string;
    jabatan: string;
    file_ttd: string | null;
    file_stempel: string | null;
}

interface Placement {
    id: string; // unik, misal hash atau random id
    page: number; // halaman PDF
    x: number; // posisi HTML X untuk TTD
    y: number; // posisi HTML Y untuk TTD
    width: number;
    height: number;
    penandatangan_id: number | null; // ID dari Penandatangan yang dipilih
    useStamp: boolean;
    stampX: number; // offset stempel X
    stampY: number; // offset stempel Y
    stampWidth: number;
    stampHeight: number;
    markerSymbol?: string; // simbol yang terdeteksi, misal '#'
    hashPosPdf?: { x: number, y: number, width: number, height: number }; // posisi asli di PDF
    hashPosHtml?: { x: number, y: number, width: number, height: number }; // posisi di layar Preview HTML
    whiteBackground?: boolean; // Jika true, TTD akan punya background putih pekat untuk nutupin teks di bawahnya
}

export default function SertifikatIndex({ penandatangans }: { penandatangans: Penandatangan[] }) {
    const [activeTab, setActiveTab] = useState<'generate' | 'manage'>('generate');

    // -- STATE UNTUK GENERATE SERTIFIKAT --
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'pdf' | 'image' | null>(null);
    const [numPages, setNumPages] = useState<number>(1);
    const [currentPage, setCurrentPage] = useState<number>(1);
    
    const [selectedPenandatangan, setSelectedPenandatangan] = useState<Penandatangan | null>(null); // Kept for image mode compatibility for now, but will mostly use placements
    const [useStamp, setUseStamp] = useState<boolean>(false); // Kept for image mode compatibility
    
    // Posisi & Ukuran TTD untuk mode gambar
    const [sigPos, setSigPos] = useState({ x: 50, y: 50, width: 200, height: 100 });
    const [stampPos, setStampPos] = useState({ x: 100, y: 50, width: 120, height: 120 });

    const [placements, setPlacements] = useState<Placement[]>([]);

    const docContainerRef = useRef<HTMLDivElement>(null);

    const [isFromUrl, setIsFromUrl] = useState<boolean>(false);

    // Auto-load PDF from URL if ?pdf_url= is provided
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const pdfUrlParam = urlParams.get('pdf_url');
        const idPenandatanganParam = urlParams.get('id_penandatangan');
        
        if (pdfUrlParam) {
            setIsFromUrl(true);
            fetch(pdfUrlParam)
                .then(res => {
                    if (!res.ok) throw new Error("Gagal mengambil file PDF");
                    return res.blob();
                })
                .then(blob => {
                    const f = new File([blob], "Sertifikat_Pengajuan.pdf", { type: "application/pdf" });
                    setFile(f);
                    setFileUrl(URL.createObjectURL(f));
                    setFileType('pdf');
                    setCurrentPage(1);
                    
                    if (idPenandatanganParam) {
                        const parsedId = parseInt(idPenandatanganParam);
                        setPlacements([{
                            id: crypto.randomUUID(),
                            page: 1,
                            penandatangan_id: parsedId,
                            useStamp: false,
                            x: 300,
                            y: 200,
                            width: 200,
                            height: 100,
                            stampX: 250,
                            stampY: 200,
                            stampWidth: 120,
                            stampHeight: 120,
                            whiteBackground: true
                        }]);
                    } else {
                        setPlacements([]);
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert("Gagal memuat dokumen PDF dari URL: " + pdfUrlParam);
                });
        }
    }, []);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            setFileUrl(URL.createObjectURL(f));
            setFileType(f.type.includes('pdf') ? 'pdf' : 'image');
            setCurrentPage(1);
            setPlacements([]); // reset
        }
    };

    const addManualPlacement = () => {
        const container = docContainerRef.current;
        const containerWidth = container?.clientWidth || 800;
        const containerHeight = container?.clientHeight || 600;

        setPlacements(prev => [...prev, {
            id: crypto.randomUUID(),
            page: currentPage,
            penandatangan_id: null,
            useStamp: false,
            x: (containerWidth / 2) - 100, // Tengan
            y: (containerHeight / 2) - 50, // Tengah
            width: 200,
            height: 100,
            stampX: (containerWidth / 2) - 40,
            stampY: (containerHeight / 2) - 50,
            stampWidth: 120,
            stampHeight: 120,
            whiteBackground: true // Manual placement default true buat nutup teks
        }]);
    };

    const removePlacement = (id: string) => {
        setPlacements(prev => prev.filter(p => p.id !== id));
    };

    const updatePlacement = (id: string, updates: Partial<Placement>) => {
        setPlacements(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const copyToAllPages = (id: string) => {
        const p = placements.find(x => x.id === id);
        if (!p) return;
        const newPlacements = [...placements];
        for (let i = 1; i <= numPages; i++) {
            if (i === p.page) continue;
            newPlacements.push({
                ...p,
                id: crypto.randomUUID(),
                page: i,
                markerSymbol: undefined,
                hashPosPdf: undefined,
                hashPosHtml: undefined
            });
        }
        setPlacements(newPlacements);
    };

    const [pdfDocInstance, setPdfDocInstance] = useState<any>(null);
    const [selectedSymbolToScan, setSelectedSymbolToScan] = useState<string>('#');

    const onDocumentLoadSuccess = async (pdfDoc: any) => {
        setNumPages(pdfDoc.numPages);
        setPdfDocInstance(pdfDoc);
    };

    const scanForSymbol = async () => {
        if (!pdfDocInstance) return;
        
        const newPlacements: Placement[] = [];
    
        for (let i = 1; i <= pdfDocInstance.numPages; i++) {
            try {
                const page = await pdfDocInstance.getPage(i);
                const textContent = await page.getTextContent();
                
                for (const item of textContent.items) {
                    if (item.str.includes(selectedSymbolToScan)) {
                        newPlacements.push({
                            id: crypto.randomUUID(),
                            page: i,
                            penandatangan_id: null,
                            useStamp: false,
                            x: 0, y: 0, width: 200, height: 100,
                            stampX: 0, stampY: 0, stampWidth: 120, stampHeight: 120,
                            markerSymbol: selectedSymbolToScan,
                            whiteBackground: false, // kalau auto-detect, udah ditutup kotak hashPos
                            hashPosPdf: {
                                x: item.transform[4],
                                y: item.transform[5],
                                width: item.width || 20,
                                height: item.height || 20
                            }
                        });
                    }
                }
            } catch (e) {
                console.error("Error scanning page", i, e);
            }
        }
        
        if (newPlacements.length > 0) {
            setPlacements(prev => [...prev, ...newPlacements]);
            alert(`Ditemukan ${newPlacements.length} simbol "${selectedSymbolToScan}"!`);
        } else {
            alert(`Simbol "${selectedSymbolToScan}" tidak ditemukan.`);
        }
    };

    const onPageLoadSuccess = async (page: any) => {
        const container = docContainerRef.current;
        if (!container) return;
    
        const { width: pdfWidth, height: pdfHeight } = page.getViewport({ scale: 1 });
        const containerWidth = container.clientWidth;
        const containerHeight = (pdfHeight / pdfWidth) * containerWidth;
    
        const scaleX = containerWidth / pdfWidth;
        const scaleY = containerHeight / pdfHeight;
    
        setPlacements(prev => prev.map(p => {
            if (p.page !== currentPage) return p;
            if (!p.hashPosPdf) return p;
    
            const htmlX = p.hashPosPdf.x * scaleX;
            const htmlY = containerHeight - (p.hashPosPdf.y * scaleY);
            const htmlWidth = p.hashPosPdf.width * scaleX;
            const htmlHeight = p.hashPosPdf.height * scaleY;
    
            const isFirstTime = !p.hashPosHtml;
            const newX = isFirstTime ? htmlX - (p.width / 2) : p.x;
            const newY = isFirstTime ? htmlY - (p.height / 2) : p.y;
            
            const newStampX = isFirstTime ? newX + (p.width / 2) : p.stampX;
            const newStampY = isFirstTime ? newY : p.stampY;
    
            return {
                ...p,
                x: newX,
                y: newY,
                stampX: newStampX,
                stampY: newStampY,
                hashPosHtml: {
                    x: htmlX,
                    y: htmlY,
                    width: htmlWidth,
                    height: htmlHeight
                }
            };
        }));
    };

    const downloadGenerated = async () => {
        if (!file || !fileUrl) return;
        
        try {
            const fileArrayBuffer = await file.arrayBuffer();
            
            const container = docContainerRef.current;
            if (!container) return;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;

            if (fileType === 'pdf') {
                const pdfDoc = await PDFDocument.load(fileArrayBuffer);
                
                // Cache untuk menghindari download/embed gambar berulang
                const imageCache: Record<string, any> = {};

                const getEmbeddedImage = async (url: string) => {
                    if (imageCache[url]) return imageCache[url];
                    const res = await fetch(url);
                    const bytes = await res.arrayBuffer();
                    const img = url.endsWith('.png') ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
                    imageCache[url] = img;
                    return img;
                };

                for (const p of placements) {
                    const penandatangan = penandatangans.find(x => x.id === p.penandatangan_id);
                    // Ambil halaman PDF yang sesuai (index 0-based)
                    const page = pdfDoc.getPage(p.page - 1);
                    const { width: pdfWidth, height: pdfHeight } = page.getSize();
                    
                    // Perhitungan skala harus proporsional (aspect ratio dijaga)
                    // Hindari penggunaan container.clientHeight karena bisa tidak akurat (terpengaruh min-h, flex, dll)
                    const logicalContainerHeight = containerWidth * (pdfHeight / pdfWidth);
                    
                    const scaleX = pdfWidth / containerWidth;
                    const scaleY = pdfHeight / logicalContainerHeight; // Akan bernilai sama dengan scaleX

                    // 1. Tutupi simbol marker jika ada
                    if (p.hashPosPdf) {
                        page.drawRectangle({
                            x: p.hashPosPdf.x - 5,
                            y: p.hashPosPdf.y - 5,
                            width: p.hashPosPdf.width + 15, 
                            height: p.hashPosPdf.height + 15,
                            color: rgb(1, 1, 1),
                        });
                    }

                    if (!penandatangan) continue;

                    // Helper function to simulate 'object-contain' in pdf-lib
                    const drawImageObjectContain = (image: any, pX: number, pY: number, pWidth: number, pHeight: number) => {
                        const boxWidth = pWidth * scaleX;
                        const boxHeight = pHeight * scaleY;
                        const boxLeftX = pX * scaleX;
                        const boxBottomY = pdfHeight - ((pY + pHeight) * scaleY);

                        const imgAspect = image.width / image.height;
                        const boxAspect = boxWidth / boxHeight;

                        let drawWidth, drawHeight;
                        if (imgAspect > boxAspect) {
                            // Lebar mengikuti box, tinggi menyesuaikan
                            drawWidth = boxWidth;
                            drawHeight = boxWidth / imgAspect;
                        } else {
                            // Tinggi mengikuti box, lebar menyesuaikan
                            drawHeight = boxHeight;
                            drawWidth = boxHeight * imgAspect;
                        }

                        const drawX = boxLeftX + (boxWidth - drawWidth) / 2;
                        const drawY = boxBottomY + (boxHeight - drawHeight) / 2;

                        page.drawImage(image, {
                            x: drawX,
                            y: drawY,
                            width: drawWidth,
                            height: drawHeight,
                        });
                    };

                    // 2. Gambar Tanda Tangan
                    if (penandatangan.file_ttd) {
                        const ttdImage = await getEmbeddedImage(penandatangan.file_ttd);
                        
                        // Kalau whiteBackground true, buat kotak putih sesuai Rnd box
                        if (p.whiteBackground) {
                            page.drawRectangle({
                                x: p.x * scaleX,
                                y: pdfHeight - ((p.y + p.height) * scaleY),
                                width: p.width * scaleX,
                                height: p.height * scaleY,
                                color: rgb(1, 1, 1),
                            });
                        }

                        drawImageObjectContain(ttdImage, p.x, p.y, p.width, p.height);
                    }

                    // 3. Gambar Stempel
                    if (p.useStamp && penandatangan.file_stempel) {
                        const stampImage = await getEmbeddedImage(penandatangan.file_stempel);
                        drawImageObjectContain(stampImage, p.stampX, p.stampY, p.stampWidth, p.stampHeight);
                    }
                }

                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Signed_${file.name}`;
                link.click();
                URL.revokeObjectURL(url);
            } else {
                // Untuk image, gambar di canvas
                const img = new Image();
                img.src = fileUrl;
                img.onload = async () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    
                    ctx.drawImage(img, 0, 0);

                    const scaleX = img.width / containerWidth;
                    const scaleY = img.height / containerHeight;

                    // Helper load image
                    const loadImg = (src: string) => new Promise<HTMLImageElement>((res) => {
                        const i = new Image();
                        i.crossOrigin = 'anonymous';
                        i.onload = () => res(i);
                        i.src = src;
                    });

                    // Cache untuk load image
                    const imageCache: Record<string, HTMLImageElement> = {};
                    const getImg = async (url: string) => {
                        if (imageCache[url]) return imageCache[url];
                        const img = await loadImg(url);
                        imageCache[url] = img;
                        return img;
                    };

                    for (const p of placements) {
                        if (p.page !== 1) continue; // image hanya punya 1 halaman
                        
                        const penandatangan = penandatangans.find(x => x.id === p.penandatangan_id);
                        if (!penandatangan) continue;

                        if (penandatangan.file_ttd) {
                            const ttdImg = await getImg(penandatangan.file_ttd);
                            ctx.drawImage(ttdImg, p.x * scaleX, p.y * scaleY, p.width * scaleX, p.height * scaleY);
                        }

                        if (p.useStamp && penandatangan.file_stempel) {
                            const stampImg = await getImg(penandatangan.file_stempel);
                            ctx.drawImage(stampImg, p.stampX * scaleX, p.stampY * scaleY, p.stampWidth * scaleX, p.stampHeight * scaleY);
                        }
                    }

                    const dataUrl = canvas.toDataURL('image/jpeg');
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = `Signed_${file.name}`;
                    link.click();
                };
            }
        } catch (error) {
            console.error("Failed to generate document", error);
            alert("Terjadi kesalahan saat memproses dokumen.");
        }
    };

    // -- STATE UNTUK MANAGE PENANDATANGAN --
    const [isEditing, setIsEditing] = useState(false);
    const [previewTtd, setPreviewTtd] = useState<string | null>(null);
    const [previewStempel, setPreviewStempel] = useState<string | null>(null);
    const { data: form, setData, post, reset, processing, errors } = useForm({
        id: '',
        nama: '',
        jabatan: '',
        file_ttd: null as File | null,
        file_stempel: null as File | null,
    });

    const editPenandatangan = (p: Penandatangan) => {
        setIsEditing(true);
        setPreviewTtd(p.file_ttd);
        setPreviewStempel(p.file_stempel);
        setData({
            id: p.id.toString(),
            nama: p.nama,
            jabatan: p.jabatan,
            file_ttd: null,
            file_stempel: null,
        });
        
        // Scroll ke form paling atas agar user sadar form-nya sudah terisi
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submitPenandatangan = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Inertia mengubah null menjadi string "null" di FormData, jadi kita hapus key-nya jika null
        const options = {
            onSuccess: () => {
                setIsEditing(false);
                setPreviewTtd(null);
                setPreviewStempel(null);
                reset();
            }
        };

        if (isEditing && form.id) {
            post(route('admin.sertifikat.penandatangan.update', form.id), {
                ...options,
                transform: (data) => {
                    const transformed = { ...data };
                    if (!transformed.file_ttd) delete transformed.file_ttd;
                    if (!transformed.file_stempel) delete transformed.file_stempel;
                    return transformed;
                }
            });
        } else {
            post(route('admin.sertifikat.penandatangan.store'), {
                ...options,
                transform: (data) => {
                    const transformed = { ...data };
                    if (!transformed.file_ttd) delete transformed.file_ttd;
                    if (!transformed.file_stempel) delete transformed.file_stempel;
                    return transformed;
                }
            });
        }
    };

    const deletePenandatangan = (id: number) => {
        if (confirm("Yakin ingin menghapus penandatangan ini?")) {
            router.delete(route('admin.sertifikat.penandatangan.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Sertifikat', href: '/admin/sertifikat' }]}>
            <Head title="Sertifikat" />

            <div className="p-4 lg:p-8 max-w-screen-xl mx-auto space-y-4 lg:space-y-6">
                
                {/* Tabs Header */}
                <div className="flex space-x-4 border-b border-border overflow-x-auto whitespace-nowrap pb-1">
                    <button 
                        className={`pb-2 px-4 font-semibold shrink-0 ${activeTab === 'generate' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('generate')}
                    >
                        Buat Sertifikat
                    </button>
                    <button 
                        className={`pb-2 px-4 font-semibold shrink-0 ${activeTab === 'manage' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('manage')}
                    >
                        Kelola Penandatangan
                    </button>
                </div>

                {activeTab === 'generate' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Panel Kiri: Form */}
                            <div className="bg-card border border-border p-5 rounded-xl space-y-5">
                                {!isFromUrl && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Unggah Dokumen (PDF/Gambar)</label>
                                        <input type="file" accept="image/*,application/pdf" onChange={onFileChange} className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                                    </div>
                                )}

                                {/* Deteksi Simbol (Hanya untuk PDF) */}
                                {fileType === 'pdf' && numPages > 0 && (
                                    <div className="border border-border p-3 rounded-lg bg-slate-50 space-y-2">
                                        <label className="block text-xs font-semibold text-slate-700">Deteksi Simbol Otomatis</label>
                                        <p className="text-[10px] text-muted-foreground leading-tight">
                                            Pilih simbol yang ingin dijadikan patokan lokasi Tanda Tangan.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <select 
                                                className="w-full sm:w-1/3 rounded-md border border-border bg-white px-2 py-1.5 text-xs focus:ring-primary focus:border-primary"
                                                value={selectedSymbolToScan}
                                                onChange={e => setSelectedSymbolToScan(e.target.value)}
                                            >
                                                <option value="#"># (Pagar)</option>
                                                <option value="^">^ (Topi)</option>
                                                <option value="$">$ (Dolar)</option>
                                                <option value="*">* (Bintang)</option>
                                                <option value="@">@ (At)</option>
                                            </select>
                                            <button 
                                                onClick={scanForSymbol}
                                                className="w-full sm:w-2/3 bg-primary text-primary-foreground text-xs font-semibold rounded py-1.5 hover:bg-primary/90 transition"
                                            >
                                                Scan Dokumen
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Daftar Penempatan (Placements) */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-sm">Daftar Penempatan TTD</h3>
                                    {placements.length === 0 ? (
                                        <p className="text-xs text-muted-foreground border border-dashed rounded p-3 text-center">Belum ada penempatan. Gunakan deteksi otomatis di atas atau klik Tambah Manual.</p>
                                    ) : (
                                        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
                                            {placements.map((p, idx) => (
                                                <div key={p.id} className="border border-border p-3 rounded-lg bg-background shadow-sm flex flex-col gap-3">
                                                    <div className="flex justify-between items-center border-b border-border pb-2">
                                                        <span className="font-semibold text-xs text-primary">
                                                            {p.markerSymbol ? `Simbol "${p.markerSymbol}" (Hal ${p.page})` : `Manual (Hal ${p.page})`}
                                                        </span>
                                                        <button onClick={() => removePlacement(p.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-1 rounded">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                    
                                                    <div>
                                                        <select 
                                                            className="w-full rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs focus:ring-primary focus:border-primary"
                                                            value={p.penandatangan_id || ''}
                                                            onChange={(e) => updatePlacement(p.id, { penandatangan_id: parseInt(e.target.value) || null })}
                                                        >
                                                            <option value="">-- Pilih Penandatangan --</option>
                                                            {penandatangans.map(pen => (
                                                                <option key={pen.id} value={pen.id}>{pen.nama} ({pen.jabatan})</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="flex flex-wrap justify-between items-center gap-3">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                className="rounded border-border text-primary focus:ring-primary"
                                                                checked={p.useStamp}
                                                                onChange={(e) => updatePlacement(p.id, { useStamp: e.target.checked })}
                                                            />
                                                            <span className="text-xs font-medium">Pakai Stempel</span>
                                                        </label>

                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                className="rounded border-border text-primary focus:ring-primary"
                                                                checked={p.whiteBackground || false}
                                                                onChange={(e) => updatePlacement(p.id, { whiteBackground: e.target.checked })}
                                                            />
                                                            <span className="text-xs font-medium text-slate-600">Background Putih</span>
                                                        </label>

                                                        <button 
                                                            onClick={() => copyToAllPages(p.id)}
                                                            className="text-[10px] bg-blue-50 text-blue-600 font-semibold border border-blue-200 rounded px-2 py-1 hover:bg-blue-100 transition-colors w-full sm:w-auto text-center"
                                                            title="Salin tata letak ini ke halaman lain yang belum memiliki manual placement"
                                                        >
                                                            Salin Semua Hal.
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button 
                                        onClick={addManualPlacement}
                                        disabled={!fileUrl}
                                        className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground border border-border py-2 rounded-md text-sm font-medium hover:bg-secondary/80 disabled:opacity-50 mt-2"
                                    >
                                        <Plus size={16} /> Tambah Manual (Hal {currentPage})
                                    </button>
                                </div>

                                <button 
                                    onClick={downloadGenerated}
                                    disabled={!fileUrl || placements.length === 0}
                                    className="w-full flex justify-center items-center gap-2 bg-primary text-primary-foreground py-2 px-4 rounded-md font-semibold hover:bg-primary/90 disabled:opacity-50"
                                >
                                    <FileDown className="w-5 h-5" /> Download Dokumen
                                </button>
                                
                                {fileType === 'pdf' && numPages > 1 && (
                                    <div className="flex items-center justify-between text-sm mt-4">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="text-primary hover:underline">Prev Page</button>
                                        <span>Page {currentPage} of {numPages}</span>
                                        <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages} className="text-primary hover:underline">Next Page</button>
                                    </div>
                                )}
                            </div>

                            {/* Panel Kanan: Preview */}
                            <div className="col-span-1 lg:col-span-2 bg-muted/30 border border-border rounded-xl min-h-[500px] flex items-center justify-center overflow-auto p-4 relative">
                                {!fileUrl ? (
                                    <div className="text-center text-muted-foreground">
                                        <FileText className="w-16 h-16 mx-auto mb-2 opacity-20" />
                                        <p>Preview Dokumen</p>
                                    </div>
                                ) : (
                                    <div className="relative w-full shadow-lg" ref={docContainerRef}>
                                        {fileType === 'pdf' ? (
                                            <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
                                                <Page onLoadSuccess={onPageLoadSuccess} pageNumber={currentPage} width={docContainerRef.current?.clientWidth || 600} renderTextLayer={false} renderAnnotationLayer={false} />
                                            </Document>
                                        ) : (
                                            <img src={fileUrl} alt="Preview" className="w-full h-auto object-contain pointer-events-none" />
                                        )}

                                        {/* Render Overlay & Rnd dari Placements */}
                                        {placements.filter(p => p.page === currentPage).map(p => {
                                            const penandatangan = penandatangans.find(x => x.id === p.penandatangan_id);
                                            
                                            return (
                                                <React.Fragment key={`frag-${p.id}`}>
                                                    {/* Overlay putih untuk menutupi simbol di PDF */}
                                                    {p.hashPosHtml && (
                                                        <div 
                                                            className="absolute bg-white z-10" 
                                                            style={{
                                                                left: p.hashPosHtml.x - 5,
                                                                top: p.hashPosHtml.y - 15,
                                                                width: p.hashPosHtml.width + 20,
                                                                height: p.hashPosHtml.height + 25
                                                            }}
                                                        />
                                                    )}

                                                    {/* Draggable Signature */}
                                                    {penandatangan?.file_ttd && (
                                                        <Rnd
                                                            key={`sig-${p.id}-${p.hashPosHtml?.x || 0}`}
                                                            default={{ x: p.x, y: p.y, width: p.width, height: p.height }}
                                                            onDragStop={(e, d) => updatePlacement(p.id, { x: d.x, y: d.y })}
                                                            onResizeStop={(e, direction, ref, delta, position) => {
                                                                updatePlacement(p.id, {
                                                                    width: parseInt(ref.style.width),
                                                                    height: parseInt(ref.style.height),
                                                                    x: position.x,
                                                                    y: position.y
                                                                });
                                                            }}
                                                            className={`border-2 border-primary border-dashed z-50 hover:cursor-move ${p.whiteBackground ? 'bg-white' : ''}`}
                                                        >
                                                            <img src={penandatangan.file_ttd} alt="TTD" className="w-full h-full object-contain pointer-events-none" />
                                                        </Rnd>
                                                    )}

                                                    {/* Draggable Stamp */}
                                                    {p.useStamp && penandatangan?.file_stempel && (
                                                        <Rnd
                                                            key={`stamp-${p.id}-${p.hashPosHtml?.x || 0}`}
                                                            default={{ x: p.stampX, y: p.stampY, width: p.stampWidth, height: p.stampHeight }}
                                                            onDragStop={(e, d) => updatePlacement(p.id, { stampX: d.x, stampY: d.y })}
                                                            onResizeStop={(e, direction, ref, delta, position) => {
                                                                updatePlacement(p.id, {
                                                                    stampWidth: parseInt(ref.style.width),
                                                                    stampHeight: parseInt(ref.style.height),
                                                                    stampX: position.x,
                                                                    stampY: position.y
                                                                });
                                                            }}
                                                            className="border-2 border-purple-500 border-dashed z-40 opacity-70 hover:cursor-move"
                                                        >
                                                            <img src={penandatangan.file_stempel} alt="Stempel" className="w-full h-full object-contain pointer-events-none" />
                                                        </Rnd>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'manage' && (
                    <div className="space-y-6">
                        <div className="bg-card border border-border p-6 rounded-xl">
                            <h3 className="text-lg font-bold mb-4">{isEditing ? 'Edit Penandatangan' : 'Tambah Penandatangan'}</h3>
                            <form onSubmit={submitPenandatangan} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nama</label>
                                    <input type="text" value={form.nama} onChange={e => setData('nama', e.target.value)} required className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Contoh: Prof. Dr. Ahmad" />
                                    {errors.nama && <div className="text-red-500 text-xs mt-1">{errors.nama}</div>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Jabatan</label>
                                    <input type="text" value={form.jabatan} onChange={e => setData('jabatan', e.target.value)} required className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Contoh: Dekan Fakultas" />
                                    {errors.jabatan && <div className="text-red-500 text-xs mt-1">{errors.jabatan}</div>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">File Tanda Tangan (PNG/JPG)</label>
                                    {isEditing && previewTtd && (
                                        <div className="mb-2">
                                            <span className="text-xs text-muted-foreground block mb-1">Tanda Tangan Saat Ini:</span>
                                            <img src={previewTtd} alt="TTD Lama" className="h-16 object-contain border border-border rounded p-1 bg-white" />
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={e => setData('file_ttd', e.target.files?.[0] || null)} className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                                    {errors.file_ttd && <div className="text-red-500 text-xs mt-1">{errors.file_ttd}</div>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">File Stempel (Opsional)</label>
                                    {isEditing && previewStempel && (
                                        <div className="mb-2">
                                            <span className="text-xs text-muted-foreground block mb-1">Stempel Saat Ini:</span>
                                            <img src={previewStempel} alt="Stempel Lama" className="h-16 object-contain border border-border rounded p-1 bg-white" />
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={e => setData('file_stempel', e.target.files?.[0] || null)} className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                                    {errors.file_stempel && <div className="text-red-500 text-xs mt-1">{errors.file_stempel}</div>}
                                </div>
                                <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-2 mt-4">
                                    {isEditing && (
                                        <button type="button" onClick={() => { setIsEditing(false); setPreviewTtd(null); setPreviewStempel(null); reset(); }} className="px-4 py-2 border border-border rounded-md hover:bg-muted w-full sm:w-auto">Batal</button>
                                    )}
                                    <button type="submit" disabled={processing} className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 flex justify-center items-center gap-2 w-full sm:w-auto">
                                        <Plus className="w-4 h-4" /> {isEditing ? 'Simpan Perubahan' : 'Simpan'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-card border border-border rounded-xl overflow-x-auto">
                            <table className="w-full text-sm text-left text-muted-foreground min-w-[600px]">
                                <thead className="text-xs uppercase bg-muted text-foreground">
                                    <tr>
                                        <th className="px-6 py-3">Nama</th>
                                        <th className="px-6 py-3">Jabatan</th>
                                        <th className="px-6 py-3">Tanda Tangan</th>
                                        <th className="px-6 py-3">Stempel</th>
                                        <th className="px-6 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {penandatangans.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 text-center">Belum ada data</td>
                                        </tr>
                                    ) : (
                                        penandatangans.map(p => (
                                            <tr key={p.id} className="border-b border-border bg-card hover:bg-muted/50">
                                                <td className="px-6 py-4 font-medium text-foreground">{p.nama}</td>
                                                <td className="px-6 py-4">{p.jabatan}</td>
                                                <td className="px-6 py-4">
                                                    {p.file_ttd ? <img src={p.file_ttd} alt="TTD" className="h-10 object-contain" /> : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {p.file_stempel ? <img src={p.file_stempel} alt="Stempel" className="h-10 object-contain" /> : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => editPenandatangan(p)} className="text-blue-500 hover:text-blue-700 mr-3">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => deletePenandatangan(p.id)} className="text-red-500 hover:text-red-700">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
