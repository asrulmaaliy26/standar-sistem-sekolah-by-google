<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArsipFile extends Model
{
    protected $table = 'arsip_file';

    protected $fillable = [
        'arsip_kategori_id',
        'uploaded_by',
        'original_name',
        'display_name',
        'path',
        'mime_type',
        'size_bytes',
        'drive_file_id',
        'drive_file_url',
        'drive_folder_id',
        'description',
        'visibility',
        'google_drive_account_id',
    ];

    protected $casts = [
        'size_bytes' => 'integer',
    ];

    /**
     * Relasi ke kategori arsip
     */
    public function kategori(): BelongsTo
    {
        return $this->belongsTo(ArsipKategori::class, 'arsip_kategori_id');
    }

    /**
     * Relasi ke uploader (user)
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Relasi ke akun google drive yang menyimpan file ini
     */
    public function googleDriveAccount(): BelongsTo
    {
        return $this->belongsTo(GoogleDriveAccount::class, 'google_drive_account_id');
    }

    /**
     * Format ukuran file yang mudah dibaca.
     */
    public function getFileSizeFormattedAttribute(): string
    {
        $bytes = $this->size_bytes ?? 0;
        if ($bytes < 1024) return $bytes . ' B';
        if ($bytes < 1048576) return round($bytes / 1024, 1) . ' KB';
        if ($bytes < 1073741824) return round($bytes / 1048576, 1) . ' MB';
        return round($bytes / 1073741824, 1) . ' GB';
    }
}
