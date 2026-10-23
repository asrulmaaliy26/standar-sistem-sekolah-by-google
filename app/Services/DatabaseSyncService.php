<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

/**
 * Sinkronisasi database VPS -> lokal (diadaptasi dari modul DatabaseSync HiGO Pondok).
 *
 * - Di VPS   : endpoint export menghasilkan SQL dump (gzip) seluruh database.
 * - Di lokal : tombol "Tarik Data dari VPS" mengunduh dump tsb lalu menimpa database lokal.
 */
class DatabaseSyncService
{
    /**
     * Tabel yang TIDAK ikut diekspor/ditimpa, agar sesi login & antrean lokal tetap aman.
     */
    protected const EXCLUDED_TABLES = [
        'sessions',
        'cache',
        'cache_locks',
        'jobs',
        'job_batches',
        'failed_jobs',
    ];

    public static function getSecretKey(): ?string
    {
        return config('services.sync.secret') ?: null;
    }

    public static function getVpsUrl(): ?string
    {
        return config('services.sync.vps_url') ?: null;
    }

    public static function validateToken(?string $token): bool
    {
        $secret = self::getSecretKey();

        if (empty($secret) || empty($token)) {
            return false;
        }

        return hash_equals($secret, $token);
    }

    /**
     * Pull hanya diizinkan di lingkungan lokal agar database produksi tidak pernah tertimpa.
     */
    public static function isLocal(): bool
    {
        return app()->environment('local', 'testing');
    }

    /**
     * Ekspor struktur + data seluruh tabel menjadi SQL dump.
     */
    public function exportDump(bool $compress = true): string
    {
        ini_set('memory_limit', '1024M');
        set_time_limit(600);

        $pdo    = DB::connection()->getPdo();
        $dbName = DB::connection()->getDatabaseName();

        $sql  = "/* SMART LPI AL HIDAYAH - DATABASE EXPORT */\n";
        $sql .= "/* Generated at: " . date('Y-m-d H:i:s') . " */\n\n";
        $sql .= "SET NAMES utf8mb4;\n";
        $sql .= "SET FOREIGN_KEY_CHECKS = 0;\n";
        $sql .= "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n\n";

        $tables = $pdo->query("SHOW FULL TABLES FROM `{$dbName}` WHERE Table_type = 'BASE TABLE'")
            ->fetchAll(\PDO::FETCH_NUM);

        foreach ($tables as $tRow) {
            $tableName = $tRow[0];

            if (in_array($tableName, self::EXCLUDED_TABLES, true)) {
                continue;
            }

            $sql .= "-- --------------------------------------------------------\n";
            $sql .= "-- Table `{$tableName}`\n";
            $sql .= "-- --------------------------------------------------------\n";
            $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";

            $createRow = $pdo->query("SHOW CREATE TABLE `{$dbName}`.`{$tableName}`")->fetch(\PDO::FETCH_ASSOC);
            if (!empty($createRow['Create Table'])) {
                $sql .= $createRow['Create Table'] . ";\n\n";
            }

            $count = (int) $pdo->query("SELECT COUNT(*) FROM `{$dbName}`.`{$tableName}`")->fetchColumn();
            if ($count === 0) {
                continue;
            }

            $batchSize = 250;
            for ($offset = 0; $offset < $count; $offset += $batchSize) {
                $rows = $pdo->query("SELECT * FROM `{$dbName}`.`{$tableName}` LIMIT {$batchSize} OFFSET {$offset}")
                    ->fetchAll(\PDO::FETCH_ASSOC);

                if (empty($rows)) {
                    break;
                }

                $colList = implode('`, `', array_keys($rows[0]));
                $values  = [];

                foreach ($rows as $row) {
                    $escaped = array_map(
                        fn($val) => $val === null ? 'NULL' : $pdo->quote((string) $val),
                        array_values($row)
                    );
                    $values[] = '(' . implode(', ', $escaped) . ')';
                }

                $sql .= "INSERT INTO `{$tableName}` (`{$colList}`) VALUES\n" . implode(",\n", $values) . ";\n";
            }

            $sql .= "\n";
        }

        $sql .= "SET FOREIGN_KEY_CHECKS = 1;\n";

        return $compress ? gzencode($sql, 6) : $sql;
    }

    /**
     * Terapkan SQL dump (plain / gzip) ke database lokal.
     */
    public function importDump(string $rawDump): array
    {
        ini_set('memory_limit', '1024M');
        set_time_limit(600);

        if (str_starts_with($rawDump, "\x1f\x8b")) {
            $sql = gzdecode($rawDump);
            if ($sql === false) {
                throw new Exception('Gagal mendekompresi file dump gzip.');
            }
        } else {
            $sql = $rawDump;
        }

        if (empty(trim($sql)) || !str_contains($sql, 'CREATE TABLE')) {
            throw new Exception('Data dump SQL dari VPS kosong atau tidak valid.');
        }

        // Kompatibilitas MySQL/MariaDB: hapus nama check constraint eksplisit (Error 3822).
        $sql = preg_replace('/CONSTRAINT\s+[`"]?[a-zA-Z0-9_]+_chk_\d+[`"]?\s+CHECK/i', 'CHECK', $sql);

        $pdo = DB::connection()->getPdo();
        $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 0;');
        $pdo->exec("SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';");

        $queries  = $this->splitSqlQueries($sql);
        $executed = 0;

        try {
            foreach ($queries as $query) {
                $pdo->exec($query);
                $executed++;
            }
        } finally {
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 1;');
        }

        return [
            'queries_executed' => $executed,
            'total_queries'    => count($queries),
            'timestamp'        => date('Y-m-d H:i:s'),
        ];
    }

    /**
     * Unduh dump dari VPS lalu timpa database lokal.
     */
    public function pullFromVps(): array
    {
        if (!self::isLocal()) {
            throw new Exception('Tarik data dari VPS hanya boleh dijalankan di lingkungan lokal (APP_ENV=local).');
        }

        $vpsUrl    = self::getVpsUrl();
        $secretKey = self::getSecretKey();

        if (empty($vpsUrl)) {
            throw new Exception('URL VPS belum dikonfigurasi pada .env (SYNC_VPS_URL).');
        }
        if (empty($secretKey)) {
            throw new Exception('Secret key belum dikonfigurasi pada .env (SYNC_SECRET_KEY).');
        }

        try {
            $response = Http::timeout(600)
                ->connectTimeout(30)
                ->withHeaders([
                    'X-Sync-Secret' => $secretKey,
                    'User-Agent'    => 'Smart-LPI-Sync/1.0',
                    'Accept'        => 'application/gzip, application/octet-stream, application/json',
                ])
                ->get($vpsUrl);
        } catch (Exception $e) {
            throw new Exception('Gagal menghubungi server VPS: ' . $e->getMessage());
        }

        if (!$response->successful()) {
            $json = $response->json();
            $msg  = $json['error'] ?? $json['message'] ?? ('HTTP Status ' . $response->status());
            throw new Exception("Server VPS menolak sinkronisasi: {$msg}");
        }

        $body = $response->body();

        if (str_starts_with(trim($body), '{')) {
            $json = json_decode($body, true);
            throw new Exception('VPS Error: ' . ($json['error'] ?? 'respons tidak dikenali'));
        }

        $details = $this->importDump($body);

        return [
            'message' => 'Database lokal berhasil diganti dengan data terbaru dari VPS.',
            'details' => $details,
        ];
    }

    /**
     * Pisahkan multi-statement SQL dengan memperhatikan string & backtick.
     */
    protected function splitSqlQueries(string $sql): array
    {
        $queries    = [];
        $current    = '';
        $inString   = false;
        $stringChar = '';
        $escaped    = false;
        $length     = strlen($sql);

        for ($i = 0; $i < $length; $i++) {
            $char = $sql[$i];

            if ($inString) {
                $current .= $char;
                if ($escaped) {
                    $escaped = false;
                } elseif ($char === '\\') {
                    $escaped = true;
                } elseif ($char === $stringChar) {
                    $inString = false;
                }
                continue;
            }

            if ($char === "'" || $char === '"' || $char === '`') {
                $inString   = true;
                $stringChar = $char;
                $current   .= $char;
            } elseif ($char === ';') {
                $trimmed = trim($current);
                if ($trimmed !== '' && !$this->isCommentOnly($trimmed)) {
                    $queries[] = $trimmed;
                }
                $current = '';
            } else {
                $current .= $char;
            }
        }

        $trimmed = trim($current);
        if ($trimmed !== '' && !$this->isCommentOnly($trimmed)) {
            $queries[] = $trimmed;
        }

        return $queries;
    }

    protected function isCommentOnly(string $chunk): bool
    {
        $stripped = preg_replace(['/\/\*.*?\*\//s', '/^\s*--.*$/m'], '', $chunk);

        return trim($stripped) === '';
    }
}
