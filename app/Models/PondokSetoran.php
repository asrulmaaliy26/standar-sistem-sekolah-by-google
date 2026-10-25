<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PondokSetoran extends Model
{
    protected $table = 'pondok_setorans';

    protected $fillable = [
        'santri_id', 'ustadz_id', 'jadwal_id', 'tanggal', 'kategori',
        'kitab_surat', 'halaman_ayat', 'status', 'nilai', 'catatan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'nilai'   => 'integer',
        ];
    }

    public function santri()
    {
        return $this->belongsTo(User::class, 'santri_id');
    }

    public function ustadz()
    {
        return $this->belongsTo(User::class, 'ustadz_id');
    }

    public function jadwal()
    {
        return $this->belongsTo(PondokJadwalSetoran::class, 'jadwal_id');
    }
}
