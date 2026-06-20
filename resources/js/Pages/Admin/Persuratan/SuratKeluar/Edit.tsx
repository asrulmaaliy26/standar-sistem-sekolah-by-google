import React, { useRef } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { ArrowLeft, Save, Upload, FileText } from 'lucide-react'

interface SuratKeluar {
    id: number
    no_surat: string
    tanggal_surat: string
    tujuan: string
    perihal: string
    isi_surat: string | null
    penandatangan: string | null
    status: string
    file_surat: string | null
}

interface EditProps {
    surat: SuratKeluar
}

export default function SuratKeluarEdit({ surat }: EditProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { data, setData, post, processing, errors } = useForm({
        _method: 'put',
        no_surat: surat.no_surat,
        tanggal_surat: surat.tanggal_surat,
        tujuan: surat.tujuan,
        perihal: surat.perihal,
        isi_surat: surat.isi_surat || '',
        penandatangan: surat.penandatangan || '',
        file_surat: null as File | null,
        status: surat.status,
    })

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        post(route('admin.surat-keluar.update', surat.id))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setData('file_surat', file)
        }
    }

    return (
        <AppLayout breadcrumbs={[
            { title: 'Surat Keluar', href: '/admin/surat-keluar' },
            { title: 'Edit Surat', href: `/admin/surat-keluar/${surat.id}/edit` }
        ]}>
            <Head title={`Edit Surat - ${surat.no_surat}`} />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href={route('admin.surat-keluar.index')}
                        className="p-2 rounded-full hover:bg-accent transition-colors"
                    >
                        <ArrowLeft size={20} className="text-muted-foreground" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Surat Keluar</h1>
                        <p className="text-sm text-muted-foreground">No. Surat: {surat.no_surat}</p>
                    </div>
                </div>

                <div className="bg-card border border-border shadow-sm rounded-lg p-6">
                    <form onSubmit={submit} className="space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Kiri */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nomor Surat <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={data.no_surat}
                                        onChange={e => setData('no_surat', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                    />
                                    {errors.no_surat && <p className="text-red-500 text-xs mt-1">{errors.no_surat}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Tanggal Surat <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        required
                                        value={data.tanggal_surat}
                                        onChange={e => setData('tanggal_surat', e.target.value)}
                                        onClick={(e) => { try { e.currentTarget.showPicker() } catch(err) {} }}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring cursor-pointer"
                                    />
                                    {errors.tanggal_surat && <p className="text-red-500 text-xs mt-1">{errors.tanggal_surat}</p>}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tujuan / Kepada <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={data.tujuan}
                                        onChange={e => setData('tujuan', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                    />
                                    {errors.tujuan && <p className="text-red-500 text-xs mt-1">{errors.tujuan}</p>}
                                </div>
                            </div>

                            {/* Kanan */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Perihal <span className="text-red-500">*</span></label>
                                    <textarea
                                        required
                                        value={data.perihal}
                                        onChange={e => setData('perihal', e.target.value)}
                                        rows={2}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                    ></textarea>
                                    {errors.perihal && <p className="text-red-500 text-xs mt-1">{errors.perihal}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Penandatangan</label>
                                    <input
                                        type="text"
                                        value={data.penandatangan}
                                        onChange={e => setData('penandatangan', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                    />
                                    {errors.penandatangan && <p className="text-red-500 text-xs mt-1">{errors.penandatangan}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Status</label>
                                    <select
                                        value={data.status}
                                        onChange={e => setData('status', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="Draft">Draft</option>
                                        <option value="Dikirim">Dikirim</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Isi Surat Textarea */}
                        <div className="pt-4 border-t border-border mt-6">
                            <label className="block text-sm font-medium mb-2">Isi Surat (Opsional / Draft)</label>
                            <textarea
                                value={data.isi_surat}
                                onChange={e => setData('isi_surat', e.target.value)}
                                rows={8}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring font-mono"
                            ></textarea>
                            {errors.isi_surat && <p className="text-red-500 text-xs mt-1">{errors.isi_surat}</p>}
                        </div>

                        {/* File Upload Full Width */}
                        <div className="pt-4 border-t border-border mt-6">
                            <label className="block text-sm font-medium mb-2">Ganti File Scan Surat (Opsional, PDF/JPG/PNG Max 5MB)</label>
                            
                            {surat.file_surat && (
                                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-3">
                                    <FileText className="text-blue-500" size={24} />
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">File Surat Saat Ini</p>
                                        <a href={`/storage/${surat.file_surat}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                                            Lihat Dokumen
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div 
                                className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-accent/10 hover:bg-accent/20 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                                <p className="text-sm font-medium">Klik untuk memilih file baru</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {data.file_surat ? data.file_surat.name : 'Abaikan jika tidak ingin mengganti file'}
                                </p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                />
                            </div>
                            {errors.file_surat && <p className="text-red-500 text-xs mt-1">{errors.file_surat}</p>}
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                            <Link
                                href={route('admin.surat-keluar.index')}
                                className="px-4 py-2 border border-input bg-background rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                                <Save size={16} />
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    )
}
