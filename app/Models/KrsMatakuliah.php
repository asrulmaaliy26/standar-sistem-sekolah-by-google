<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KrsMatakuliah extends Model
{
    use HasFactory;

    protected $fillable = [
        'krs_period_id',
        'kode_mk',
        'nama_mk',
        'kelas',
        'sks',
        'jenis_ruang',
    ];

    public function period()
    {
        return $this->belongsTo(KrsPeriod::class, 'krs_period_id');
    }

    public function jadwalPlots()
    {
        return $this->hasMany(KrsJadwalPlot::class);
    }
}
