<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KrsPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'tahun_akademik',
        'semester',
        'is_active',
        'hari_aktif'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'hari_aktif' => 'array',
    ];

    public function krsMatakuliahs()
    {
        return $this->hasMany(KrsMatakuliah::class);
    }

    public function krsDosens()
    {
        return $this->hasMany(KrsDosen::class);
    }

    public function krsRuangs()
    {
        return $this->hasMany(KrsRuang::class);
    }

    public function krsWaktus()
    {
        return $this->hasMany(KrsWaktu::class);
    }

    public function jadwalPlots()
    {
        return $this->hasMany(KrsJadwalPlot::class);
    }
}
