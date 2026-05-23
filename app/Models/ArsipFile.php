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
        'mime_type',
        'size_bytes',
        'drive_file_id',
        'drive_file_url',
        'drive_folder_id',
        'description',
        'path',
    ];

    protected $casts = [
        'size_bytes' => 'integer',
    ];

    public function kategori(): BelongsTo
    {
        return $this->belongsTo(ArsipKategori::class, 'arsip_kategori_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
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
