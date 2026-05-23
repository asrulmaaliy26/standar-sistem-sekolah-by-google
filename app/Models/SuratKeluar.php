<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SuratKeluar extends Model
{
    protected $fillable = [
        'no_surat',
        'tanggal_surat',
        'tujuan',
        'perihal',
        'isi_surat',
        'penandatangan',
        'file_surat',
        'status',
    ];
}
