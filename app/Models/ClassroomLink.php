<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassroomLink extends Model
{
    protected $fillable = ['guru_id', 'rombel_id', 'mapel', 'link', 'keterangan'];

    public function guru()
    {
        return $this->belongsTo(User::class, 'guru_id');
    }

    public function rombel()
    {
        return $this->belongsTo(Rombel::class);
    }
}
