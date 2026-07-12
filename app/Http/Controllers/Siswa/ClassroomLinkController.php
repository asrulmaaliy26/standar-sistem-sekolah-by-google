<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\ClassroomLink;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClassroomLinkController extends Controller
{
    /**
     * Display a listing of classroom links for the current student's rombel.
     */
    public function index()
    {
        $user = auth()->user();
        
        // Jika belum ada kelas, balikan koleksi kosong
        $links = collect();
        $examSessions = collect();

        if ($user->rombel_id) {
            $links = ClassroomLink::with('guru:id,name')
                ->where('rombel_id', $user->rombel_id)
                ->latest()
                ->get();
                
            $examSessions = \App\Models\ExamSession::where('user_id', $user->id)
                ->whereIn('classroom_link_id', $links->pluck('id'))
                ->get(['classroom_link_id', 'exam_type', 'status']);
        }

        return Inertia::render('Siswa/ClassroomLinks/Index', [
            'links' => $links,
            'rombel' => $user->rombel ? $user->rombel->name : null,
            'examSessions' => $examSessions,
        ]);
    }
}
