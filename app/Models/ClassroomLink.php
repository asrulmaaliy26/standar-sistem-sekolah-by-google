<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassroomLink extends Model
{
    protected $fillable = [
        'guru_id', 'rombel_id', 'mapel', 'link',
        'link_uts', 'uts_mulai', 'uts_tutup', 'uts_durasi',
        'link_uas', 'uas_mulai', 'uas_tutup', 'uas_durasi',
        'keterangan',
        'hari_belajar', 'jam_mulai', 'jam_selesai',
    ];

    public function guru()
    {
        return $this->belongsTo(User::class, 'guru_id');
    }

    public function rombel()
    {
        return $this->belongsTo(Rombel::class);
    }
}
