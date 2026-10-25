<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MadinKelas extends Model
{
    protected $table = 'madin_kelas';

    protected $fillable = ['nama_kelas', 'tingkat', 'wali_kelas_id', 'deskripsi'];

    public function waliKelas()
    {
        return $this->belongsTo(User::class, 'wali_kelas_id');
    }

    public function santri()
    {
        return $this->hasMany(User::class, 'madin_kelas_id');
    }

    public function classroomLinks()
    {
        return $this->hasMany(ClassroomLink::class, 'madin_kelas_id');
    }
}
