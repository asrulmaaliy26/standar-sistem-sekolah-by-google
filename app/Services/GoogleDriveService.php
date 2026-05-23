<?php

namespace App\Services;

use App\Models\User;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class GoogleDriveService
{
    const ROOT_FOLDER = 'SMARTLPIALHIDAYAH';

    /**
     * Upload file ke Google Drive user.
     * Struktur: SMARTLPIALHIDAYAH / [kategori] / [path] / [file]
     *
     * @return array{drive_file_id: string, drive_file_url: string, drive_folder_id: string}|null
     */
    public function uploadFile(User $user, string $kategoriName, UploadedFile $file, string $displayName, ?string $path = null): ?array
    {
        $systemUser = User::getSystemGoogleDriveUser();
        $client = $systemUser ? $systemUser->getGoogleClient() : null;

        if (! $client) {
            Log::warning("GoogleDriveService: System Google Drive access is not configured. (User {$user->id} tried to upload)");
            return null;
        }

        try {
            $driveService = new Drive($client);

            // 1. Pastikan folder root ada
            $rootFolderId = $this->ensureFolderExists($driveService, self::ROOT_FOLDER, null);

            // 2. Pastikan folder kategori ada di dalam root
            $kategoriFolderId = $this->ensureFolderExists($driveService, $kategoriName, $rootFolderId);

            $currentParentId = $kategoriFolderId;

            // 3. Pastikan subfolder berdasarkan path ada
            if ($path) {
                // Hapus spasi dan slash di awal/akhir, lalu pecah berdasarkan slash
                $segments = array_filter(explode('/', str_replace('\\', '/', trim($path, '/ '))));
                foreach ($segments as $segment) {
                    $segment = trim($segment);
                    if ($segment) {
                        $currentParentId = $this->ensureFolderExists($driveService, $segment, $currentParentId);
                    }
                }
            }

            // 4. Upload file ke folder tujuan akhir
            $driveFileMetadata = new DriveFile([
                'name'    => $displayName,
                'parents' => [$currentParentId],
            ]);

            $mimeType = $file->getMimeType() ?? 'application/octet-stream';
            $driveFile = $driveService->files->create($driveFileMetadata, [
                'data'       => file_get_contents($file->getRealPath()),
                'mimeType'   => $mimeType,
                'uploadType' => 'multipart',
                'fields'     => 'id,name,webViewLink',
            ]);

            return [
                'drive_file_id'   => $driveFile->getId(),
                'drive_file_url'  => $driveFile->getWebViewLink(),
                'drive_folder_id' => $kategoriFolderId,
            ];
        } catch (\Exception $e) {
            Log::error("GoogleDriveService upload error for user {$user->id}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Hapus file dari Google Drive user.
     */
    public function deleteFile(User $user, string $driveFileId): bool
    {
        $systemUser = User::getSystemGoogleDriveUser();
        $client = $systemUser ? $systemUser->getGoogleClient() : null;
        if (! $client) return false;

        try {
            $driveService = new Drive($client);
            $driveService->files->delete($driveFileId);
            return true;
        } catch (\Exception $e) {
            Log::error("GoogleDriveService delete error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Pastikan folder dengan nama tertentu ada di Drive.
     * Jika belum ada, buat. Return folder ID.
     */
    private function ensureFolderExists(Drive $driveService, string $name, ?string $parentId): string
    {
        // Cari folder yang sudah ada
        $query = "name = '{$name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
        if ($parentId) {
            $query .= " and '{$parentId}' in parents";
        }

        $results = $driveService->files->listFiles([
            'q'      => $query,
            'fields' => 'files(id, name)',
            'spaces' => 'drive',
        ]);

        if (count($results->getFiles()) > 0) {
            return $results->getFiles()[0]->getId();
        }

        // Buat folder baru
        $folderMetadata = new DriveFile([
            'name'     => $name,
            'mimeType' => 'application/vnd.google-apps.folder',
            'parents'  => $parentId ? [$parentId] : [],
        ]);

        $folder = $driveService->files->create($folderMetadata, [
            'fields' => 'id',
        ]);

        return $folder->getId();
    }
}
