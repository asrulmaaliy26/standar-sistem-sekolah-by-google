import React, { useRef } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { ArrowLeft, Save, Upload } from 'lucide-react'

export default function SuratKeluarCreate() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { data, setData, post, processing, errors } = useForm({
        tanggal_surat: '',
        tujuan: '',
        perihal: '',
        isi_surat: '',
        penandatangan: '',
        file_surat: null as File | null,
        status: 'Draft',
    })

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        post(route('admin.surat-keluar.store'))
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
            { title: 'Buat Surat Keluar', href: '/admin/surat-keluar/create' }
        ]}>
            <Head title="Buat Surat Keluar" />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href={route('admin.surat-keluar.index')}
                        className="p-2 rounded-full hover:bg-accent transition-colors"
                    >
                        <ArrowLeft size={20} className="text-muted-foreground" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Buat Surat Keluar</h1>
                        <p className="text-sm text-muted-foreground">Nomor surat akan di-generate otomatis setelah disimpan.</p>
                    </div>
                </div>

                <div className="bg-card border border-border shadow-sm rounded-lg p-6">
                    <form onSubmit={submit} className="space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Kiri */}
                            <div className="space-y-4">
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
                                        placeholder="Cth: Dinas Pendidikan Kota Blitar"
                                    />
                                    {errors.tujuan && <p className="text-red-500 text-xs mt-1">{errors.tujuan}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Perihal <span className="text-red-500">*</span></label>
                                    <textarea
                                        required
                                        value={data.perihal}
                                        onChange={e => setData('perihal', e.target.value)}
                                        rows={2}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                        placeholder="Cth: Undangan Rapat Koordinasi"
                                    ></textarea>
                                    {errors.perihal && <p className="text-red-500 text-xs mt-1">{errors.perihal}</p>}
                                </div>
                            </div>

                            {/* Kanan */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Penandatangan</label>
                                    <input
                                        type="text"
                                        value={data.penandatangan}
                                        onChange={e => setData('penandatangan', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                        placeholder="Cth: Kepala Sekolah"
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
                                placeholder="Ketik isi surat di sini..."
                            ></textarea>
                            {errors.isi_surat && <p className="text-red-500 text-xs mt-1">{errors.isi_surat}</p>}
                        </div>

                        {/* File Upload Full Width */}
                        <div className="pt-4 border-t border-border mt-6">
                            <label className="block text-sm font-medium mb-2">File Scan Surat (Jika sudah ditandatangani, PDF/JPG/PNG Max 5MB)</label>
                            
                            <div 
                                className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-accent/10 hover:bg-accent/20 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                                <p className="text-sm font-medium">Klik untuk memilih file</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {data.file_surat ? data.file_surat.name : 'Belum ada file yang dipilih'}
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
                                {processing ? 'Menyimpan...' : 'Simpan Data'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    )
}
