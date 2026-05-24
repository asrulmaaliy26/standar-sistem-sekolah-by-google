<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KrsWaktu extends Model
{
    use HasFactory;

    protected $fillable = [
        'krs_period_id',
        'jam_mulai',
        'jam_selesai',
        'durasi_menit',
    ];

    public function period()
    {
        return $this->belongsTo(KrsPeriod::class, 'krs_period_id');
    }
}
