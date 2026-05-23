<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Jenjang extends Model
{
    protected $table = 'jenjang';

    protected $fillable = ['nama', 'lokasi', 'deskripsi'];

    public function rombels()
    {
        return $this->hasMany(Rombel::class, 'jenjang_id');
    }

    public function users()
    {
        return $this->hasManyThrough(User::class, Rombel::class, 'jenjang_id', 'rombel_id');
    }
}
