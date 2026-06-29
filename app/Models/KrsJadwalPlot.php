<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KrsJadwalPlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'krs_period_id',
        'krs_matakuliah_id',
        'krs_dosen_id',
        'krs_dosen_kedua_id',
        'krs_ruang_id',
        'hari',
        'krs_waktu_ids', // json array of time ids
        'is_conflict',
        'conflict_message',
        'is_locked',
    ];

    protected $casts = [
        'krs_waktu_ids' => 'array',
        'is_conflict' => 'boolean',
        'is_locked' => 'boolean',
    ];

    public function period()
    {
        return $this->belongsTo(KrsPeriod::class, 'krs_period_id');
    }

    public function matakuliah()
    {
        return $this->belongsTo(KrsMatakuliah::class, 'krs_matakuliah_id');
    }

    public function dosen()
    {
        return $this->belongsTo(KrsDosen::class, 'krs_dosen_id');
    }

    public function dosenKedua()
    {
        return $this->belongsTo(KrsDosen::class, 'krs_dosen_kedua_id');
    }

    public function ruang()
    {
        return $this->belongsTo(KrsRuang::class, 'krs_ruang_id');
    }
}
