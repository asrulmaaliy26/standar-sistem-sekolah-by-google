<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rombel extends Model
{
    protected $fillable = ['name', 'lokasi', 'jenjang_id'];

    public function jenjang()
    {
        return $this->belongsTo(Jenjang::class, 'jenjang_id');
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function classroomLinks()
    {
        return $this->hasMany(ClassroomLink::class);
    }
}
