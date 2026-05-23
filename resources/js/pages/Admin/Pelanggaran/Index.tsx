import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';

export default function PelanggaranIndex({ pelanggarans, filters }: any) {
    const [search, setSearch] = useState(filters?.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.pelanggaran.index'), { search }, { preserveState: true });
    };

    const breadcrumbs = [
        {
            title: 'Daftar Pelanggaran Ujian',
            href: route('admin.pelanggaran.index'),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pelanggaran Ujian" />
            <div className="p-6">
                <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pelanggaran Ujian</h1>
                        <p className="text-gray-500 dark:text-gray-400">Daftar siswa yang terdeteksi melakukan kecurangan.</p>
                    </div>
                    
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari NIM / Nama..."
                            className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                            Cari
                        </button>
                    </form>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                    <th className="p-4 font-medium text-gray-600 dark:text-gray-300">NIM</th>
                                    <th className="p-4 font-medium text-gray-600 dark:text-gray-300">Nama Siswa</th>
                                    <th className="p-4 font-medium text-gray-600 dark:text-gray-300">Jenis Pelanggaran</th>
                                    <th className="p-4 font-medium text-gray-600 dark:text-gray-300">Waktu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {pelanggarans.data.length > 0 ? (
                                    pelanggarans.data.map((p: any) => (
                                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="p-4 text-gray-900 dark:text-gray-100">{p.nim || '-'}</td>
                                            <td className="p-4 text-gray-900 dark:text-gray-100">{p.nama_siswa || '-'}</td>
                                            <td className="p-4">
                                                <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-2.5 py-1 rounded-md text-sm font-medium border border-red-200 dark:border-red-800/50">
                                                    {p.jenis_pelanggaran}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-900 dark:text-gray-100">
                                                {format(new Date(p.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            Tidak ada data pelanggaran.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="mt-6 flex justify-center gap-2 flex-wrap">
                    {pelanggarans.links.map((link: any, idx: number) => (
                        <button
                            key={idx}
                            onClick={() => {
                                if (link.url) router.visit(link.url);
                            }}
                            disabled={!link.url || link.active}
                            className={`px-4 py-2 border rounded-md transition-colors ${
                                link.active 
                                    ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-600 dark:border-blue-600' 
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                            } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
