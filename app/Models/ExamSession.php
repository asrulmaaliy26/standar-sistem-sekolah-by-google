<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamSession extends Model
{
    protected $fillable = [
        'user_id',
        'classroom_link_id',
        'exam_type',
        'status',
        'violation_count',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function classroomLink()
    {
        return $this->belongsTo(ClassroomLink::class);
    }
}
