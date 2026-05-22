<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalendarEvent extends Model
{
    protected $fillable = [
        'title',
        'description',
        'location',
        'start_at',
        'end_at',
        'color',
        'status',
        'created_by',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at'   => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function files()
    {
        return $this->hasMany(CalendarEventFile::class, 'calendar_event_id');
    }
}
