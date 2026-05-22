<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Jabatan extends Model
{
    protected $table = 'jabatan';

    protected $fillable = [
        'name',
        'description',
    ];

    public $timestamps = true;

    /**
     * Get the users that have this jabatan.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_jabatan', 'jabatan_id', 'user_id');
    }
}
