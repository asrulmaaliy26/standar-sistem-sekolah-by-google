<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KrsDosen extends Model
{
    use HasFactory;

    protected $fillable = [
        'krs_period_id',
        'nama_dosen',
        'kode_mk',
        'kelas',
        'prioritas',
        'max_sks',
    ];

    public function period()
    {
        return $this->belongsTo(KrsPeriod::class, 'krs_period_id');
    }
}
