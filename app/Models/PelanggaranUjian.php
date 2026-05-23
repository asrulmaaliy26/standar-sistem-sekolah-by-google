<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PelanggaranUjian extends Model
{
    protected $fillable = [
        'nim',
        'nama_siswa',
        'jenis_pelanggaran',
    ];
}
