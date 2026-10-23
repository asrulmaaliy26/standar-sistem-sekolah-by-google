<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DatabaseSyncService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DatabaseSyncController extends Controller
{
    public function __construct(protected DatabaseSyncService $syncService)
    {
    }

    /**
     * [VPS] Unduh dump database (.sql.gz). Wajib header X-Sync-Secret.
     */
    public function export(Request $request)
    {
        $token = $request->header('X-Sync-Secret');

        if (!DatabaseSyncService::validateToken($token)) {
            Log::warning('Ekspor database ditolak: secret tidak valid dari IP ' . $request->ip());

            return response()->json([
                'success' => false,
                'error'   => 'Akses ditolak. Secret token sinkronisasi tidak valid atau belum dikonfigurasi.',
            ], 403);
        }

        try {
            $dump     = $this->syncService->exportDump(true);
            $filename = 'smart_lpi_db_' . date('Ymd_His') . '.sql.gz';

            return response($dump, 200, [
                'Content-Type'        => 'application/gzip',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Content-Length'      => strlen($dump),
                'Cache-Control'       => 'no-store, no-cache, must-revalidate',
            ]);
        } catch (Exception $e) {
            Log::error('Gagal ekspor database: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error'   => 'Gagal mengekspor database: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * [Lokal] Tombol "Tarik Data dari VPS" — superadmin only.
     */
    public function pull(Request $request)
    {
        if (!$request->user()?->isAdmin()) {
            abort(403, 'Hanya Superadmin yang dapat menarik data dari VPS.');
        }

        try {
            $result = $this->syncService->pullFromVps();
            $d      = $result['details'];

            return back()->with('success', "{$result['message']} ({$d['queries_executed']} query dijalankan)");
        } catch (Exception $e) {
            Log::error('Tarik data VPS gagal: ' . $e->getMessage());

            return back()->with('error', $e->getMessage());
        }
    }
}
