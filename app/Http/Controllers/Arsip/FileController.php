<?php

namespace App\Http\Controllers\Arsip;

use App\Http\Controllers\Controller;
use App\Models\ArsipFile;
use App\Models\ArsipKategori;
use App\Models\Rombel;
use App\Services\GoogleDriveService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FileController extends Controller
{
    public function __construct(private GoogleDriveService $driveService) {}

    /**
     * Halaman utama arsip — list semua file, bisa filter per kategori.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $kategoriList = ArsipKategori::withCount('files')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'color', 'description']);

        $query = ArsipFile::with(['kategori:id,name,color,slug', 'uploader:id,name'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('kategori')) {
            $query->whereHas('kategori', fn($q) => $q->where('slug', $request->kategori));
        }

        $tahun = $request->has('tahun') ? $request->tahun : date('Y');
        if ($tahun) {
            $query->whereYear('created_at', $tahun);
        }

        if ($request->filled('bulan')) {
            $query->whereMonth('created_at', $request->bulan);
        }

        if ($request->filled('kelas')) {
            $query->whereHas('uploader', function ($q) use ($request) {
                $q->where('rombel_id', $request->kelas);
            });
        }

        $availableYears = ArsipFile::selectRaw('YEAR(created_at) as year')
            ->distinct()
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->toArray();
            
        $currentYear = (int) date('Y');
        if (!in_array($currentYear, $availableYears)) {
            array_unshift($availableYears, $currentYear);
            rsort($availableYears);
        }

        $files = $query->get()->map(fn($f) => [
            'id'             => $f->id,
            'display_name'   => $f->display_name,
            'original_name'  => $f->original_name,
            'mime_type'      => $f->mime_type,
            'size'           => $f->file_size_formatted,
            'drive_file_url' => $f->drive_file_url,
            'drive_file_id'  => $f->drive_file_id,
            'description'    => $f->description,
            'path'           => $f->path,
            'kategori'       => $f->kategori ? [
                'id'    => $f->kategori->id,
                'name'  => $f->kategori->name,
                'color' => $f->kategori->color,
                'slug'  => $f->kategori->slug,
            ] : null,
            'uploader'       => $f->uploader?->name,
            'uploader_id'    => $f->uploaded_by,
            'is_owner'       => $f->uploaded_by === $user->id,
            'created_at'     => $f->created_at->format('Y-m-d H:i'),
        ]);

        $systemUser = \App\Models\User::getSystemGoogleDriveUser();
        $hasDriveAccess = $systemUser !== null;
        $driveOwnerEmail = $systemUser ? $systemUser->email : null;

        $rombels = Rombel::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Arsip/Index', [
            'files'          => $files,
            'kategoriList'   => $kategoriList,
            'availableYears' => $availableYears,
            'rombels'        => $rombels,
            'hasDriveAccess' => $hasDriveAccess,
            'driveOwnerEmail'=> $driveOwnerEmail,
            'activeKategori' => $request->kategori,
            'activeTahun'    => $tahun,
            'activeBulan'    => $request->bulan,
            'activeKelas'    => $request->kelas,
            'canManageKategori' => $this->canManageKategori($user),
        ]);
    }

    /**
     * Upload file baru ke Google Drive.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (! \App\Models\User::getSystemGoogleDriveUser()) {
            return back()->with('error', 'Sistem belum dikonfigurasi. Admin perlu mengizinkan akses Google Drive.');
        }

        $validated = $request->validate([
            'arsip_kategori_id' => 'required|exists:arsip_kategori,id',
            'file'              => 'required|file|max:51200', // max 50MB
            'display_name'      => 'nullable|string|max:255',
            'description'       => 'nullable|string|max:500',
            'path'              => 'nullable|string|max:255',
        ]);

        $file     = $request->file('file');
        $kategori = ArsipKategori::findOrFail($validated['arsip_kategori_id']);

        $displayName = $validated['display_name'] ?? $file->getClientOriginalName();

        // Bangun path: tahun / kelas / nama_user
        $tahun = date('Y');
        $user->loadMissing('rombel');
        $kelas = $user->rombel ? str_replace('/', '-', $user->rombel->name) : 'Tanpa Kelas';
        // Hapus karakter slash dari nama user untuk menghindari pembuatan folder berlebih
        $namaUser = str_replace('/', '-', $user->name);
        
        $basePath = "{$tahun}/{$kelas}/{$namaUser}";
        
        // Jika ada custom path tambahan dari input user, taruh di dalamnya
        $finalPath = !empty($validated['path']) ? $basePath . '/' . trim($validated['path'], '/ ') : $basePath;

        // Upload ke Google Drive
        $driveResult = $this->driveService->uploadFile(
            $user,
            $kategori->name,
            $file,
            $displayName,
            $finalPath,
        );

        if (! $driveResult) {
            return back()->with('error', 'Gagal mengupload ke Google Drive. Pastikan Google Drive Sistem sudah terkonfigurasi dengan benar.');
        }

        // Simpan metadata ke database
        ArsipFile::create([
            'arsip_kategori_id' => $kategori->id,
            'uploaded_by'       => $user->id,
            'original_name'     => $file->getClientOriginalName(),
            'display_name'      => $displayName,
            'mime_type'         => $file->getMimeType(),
            'size_bytes'        => $file->getSize(),
            'drive_file_id'     => $driveResult['drive_file_id'],
            'drive_file_url'    => $driveResult['drive_file_url'],
            'drive_folder_id'   => $driveResult['drive_folder_id'],
            'description'       => $validated['description'] ?? null,
            'path'              => $finalPath,
        ]);

        return back()->with('success', 'File "' . $displayName . '" berhasil diupload ke Google Drive.');
    }

    /**
     * Hapus file dari Drive dan database.
     */
    public function destroy(Request $request, ArsipFile $arsipFile)
    {
        $user = $request->user();

        // Hanya pemilik file atau admin yang bisa hapus
        if ($arsipFile->uploaded_by !== $user->id && ! $user->isAdmin()) {
            return back()->with('error', 'Anda tidak memiliki izin untuk menghapus file ini.');
        }

        // Hapus dari Drive milik uploader asli (atau fallback ke sistem jika user dihapus)
        $uploader = $arsipFile->uploader ?? \App\Models\User::getSystemGoogleDriveUser();
        if ($uploader && $arsipFile->drive_file_id) {
            $this->driveService->deleteFile($uploader, $arsipFile->drive_file_id);
        }

        $arsipFile->delete();

        return back()->with('success', 'File berhasil dihapus.');
    }

    private function canManageKategori($user): bool
    {
        if ($user->isAdmin()) return true;
        $user->loadMissing('jabatan');
        return $user->jabatan->pluck('name')->contains('kepala sekolah');
    }
}
