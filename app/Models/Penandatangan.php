<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Penandatangan extends Model
{
    protected $fillable = [
        'nama',
        'jabatan',
        'file_ttd',
        'file_stempel',
    ];
}
