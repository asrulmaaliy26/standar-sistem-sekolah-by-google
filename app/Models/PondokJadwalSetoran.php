<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PondokJadwalSetoran extends Model
{
    protected $table = 'pondok_jadwal_setoran';

    protected $fillable = [
        'nama_sesi', 'hari', 'tanggal', 'waktu_mulai', 'waktu_selesai',
        'ustadz_id', 'kamar_id', 'is_aktif',
    ];

    protected function casts(): array
    {
        return [
            'tanggal'  => 'date',
            'is_aktif' => 'boolean',
        ];
    }

    public function ustadz()
    {
        return $this->belongsTo(User::class, 'ustadz_id');
    }

    public function kamar()
    {
        return $this->belongsTo(Kamar::class);
    }

    public function setorans()
    {
        return $this->hasMany(PondokSetoran::class, 'jadwal_id');
    }
}
