<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kamar extends Model
{
    protected $fillable = ['nama_kamar', 'gedung', 'kapasitas', 'gender', 'pembina_id', 'keterangan'];

    public function pembina()
    {
        return $this->belongsTo(User::class, 'pembina_id');
    }

    public function santri()
    {
        return $this->hasMany(User::class, 'kamar_id');
    }

    public function jadwalSetoran()
    {
        return $this->hasMany(PondokJadwalSetoran::class);
    }
}
