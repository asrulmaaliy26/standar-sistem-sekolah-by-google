<?php

namespace App\Console\Commands;

use App\Services\DatabaseSyncService;
use Illuminate\Console\Command;

class PullDatabaseFromVps extends Command
{
    protected $signature = 'db:pull-vps {--force : Lewati konfirmasi}';

    protected $description = 'Unduh database terbaru dari VPS dan timpa database lokal';

    public function handle(DatabaseSyncService $service): int
    {
        $this->warn('Seluruh data di database lokal akan DIHAPUS dan diganti dengan data dari VPS.');
        $this->line('Sumber: ' . (DatabaseSyncService::getVpsUrl() ?? '-'));

        if (!$this->option('force') && !$this->confirm('Lanjutkan?')) {
            return self::FAILURE;
        }

        try {
            $this->info('Mengunduh & mengimpor... (bisa memakan waktu beberapa menit)');
            $result = $service->pullFromVps();
            $this->info($result['message']);
            $this->line("Query dijalankan: {$result['details']['queries_executed']}");

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }
    }
}
