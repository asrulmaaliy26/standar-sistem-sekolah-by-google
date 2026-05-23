<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SuratMasuk extends Model
{
    protected $fillable = [
        'no_agenda',
        'no_surat',
        'tanggal_surat',
        'tanggal_terima',
        'pengirim',
        'perihal',
        'sifat',
        'lampiran',
        'file_surat',
        'status',
    ];
}
