<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KrsRuang extends Model
{
    use HasFactory;

    protected $fillable = [
        'krs_period_id',
        'kode_ruang',
        'nama_ruang',
        'kapasitas',
        'jenis_ruang',
    ];

    public function period()
    {
        return $this->belongsTo(KrsPeriod::class, 'krs_period_id');
    }
}
