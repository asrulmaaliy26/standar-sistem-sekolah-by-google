<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CalendarEventFile extends Model
{
    protected $fillable = [
        'calendar_event_id',
        'file_name',
        'file_path',
        'description',
    ];

    public function event()
    {
        return $this->belongsTo(CalendarEvent::class, 'calendar_event_id');
    }
}
