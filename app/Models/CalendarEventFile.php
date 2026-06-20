<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CalendarEventFile extends Model
{
    protected $fillable = [
        'calendar_event_id',
        'file_name',
        'file_path',
        'description',
    ];

    /**
     * Tambahkan atribut virtual 'url' agar controller tidak perlu
     * mengulang logika pembentukan URL Google Drive / storage lokal.
     *
     * @var array<string>
     */
    protected $appends = ['url'];

    /**
     * Accessor: kembalikan URL publik file, baik dari Google Drive
     * maupun dari penyimpanan lokal (storage/public).
     */
    public function getUrlAttribute(): string
    {
        if (str_starts_with($this->file_path, 'gdrive:')) {
            $driveFileId = substr($this->file_path, 7);
            return "https://drive.google.com/file/d/{$driveFileId}/view";
        }

        return asset('storage/' . $this->file_path);
    }

    /**
     * Relasi ke event kalender induk.
     */
    public function event()
    {
        return $this->belongsTo(CalendarEvent::class, 'calendar_event_id');
    }
}
