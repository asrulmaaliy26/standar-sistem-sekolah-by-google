import React, { useRef } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { ArrowLeft, Save, Upload } from 'lucide-react'

export default function SuratMasukCreate() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { data, setData, post, processing, errors } = useForm({
        no_surat: '',
        tanggal_surat: '',
        tanggal_terima: '',
        pengirim: '',
        perihal: '',
        sifat: 'Biasa',
        lampiran: '',
        file_surat: null as File | null,
        status: 'Baru',
    })

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        post(route('admin.surat-masuk.store'))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setData('file_surat', file)
        }
    }

    return (
        <AppLayout breadcrumbs={[
            { title: 'Surat Masuk', href: '/admin/surat-masuk' },
            { title: 'Tambah Surat', href: '/admin/surat-masuk/create' }
        ]}>
            <Head title="Input Surat Masuk" />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href={route('admin.surat-masuk.index')}
                        className="p-2 rounded-full hover:bg-accent transition-colors"
                    >
                        <ArrowLeft size={20} className="text-muted-foreground" />
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Input Surat Masuk</h1>
                </div>

                <div className="bg-card border border-border shadow-sm rounded-lg p-6">
                    <form onSubmit={submit} className="space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Kiri */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nomor Surat (dari Pengirim)</label>
                                    <input
                                        type="text"
                                        value={data.no_surat}
                                        onChange={e => setData('no_surat', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                        placeholder="Cth: 123/X/2026"
                                    />
                                    {errors.no_surat && <p className="text-red-500 text-xs mt-1">{errors.no_surat}</p>}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Pengirim <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={data.pengirim}
                                        onChange={e => setData('pengirim', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                        placeholder="Cth: Dinas Pendidikan"
                                    />
                                    {errors.pengirim && <p className="text-red-500 text-xs mt-1">{errors.pengirim}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
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
                                        <label className="block text-sm font-medium mb-1">Tanggal Terima</label>
                                        <input
                                            type="date"
                                            value={data.tanggal_terima}
                                            onChange={e => setData('tanggal_terima', e.target.value)}
                                            onClick={(e) => { try { e.currentTarget.showPicker() } catch(err) {} }}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring cursor-pointer"
                                        />
                                        {errors.tanggal_terima && <p className="text-red-500 text-xs mt-1">{errors.tanggal_terima}</p>}
                                    </div>
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
                                        rows={3}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                        placeholder="Cth: Undangan Rapat Koordinasi"
                                    ></textarea>
                                    {errors.perihal && <p className="text-red-500 text-xs mt-1">{errors.perihal}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Sifat</label>
                                        <select
                                            value={data.sifat}
                                            onChange={e => setData('sifat', e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                        >
                                            <option value="Biasa">Biasa</option>
                                            <option value="Penting">Penting</option>
                                            <option value="Rahasia">Rahasia</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Status</label>
                                        <select
                                            value={data.status}
                                            onChange={e => setData('status', e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                        >
                                            <option value="Baru">Baru</option>
                                            <option value="Diproses">Diproses</option>
                                            <option value="Selesai">Selesai</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Jumlah Lampiran</label>
                                    <input
                                        type="text"
                                        value={data.lampiran}
                                        onChange={e => setData('lampiran', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                        placeholder="Cth: 2 Lembar / 1 Berkas"
                                    />
                                    {errors.lampiran && <p className="text-red-500 text-xs mt-1">{errors.lampiran}</p>}
                                </div>
                            </div>
                        </div>

                        {/* File Upload Full Width */}
                        <div className="pt-4 border-t border-border mt-6">
                            <label className="block text-sm font-medium mb-2">File Scan Surat (PDF/JPG/PNG, Max 5MB)</label>
                            
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
                                href={route('admin.surat-masuk.index')}
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
