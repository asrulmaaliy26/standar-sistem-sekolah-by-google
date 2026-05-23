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

        if ($user->rombel_id) {
            $links = ClassroomLink::with('guru:id,name')
                ->where('rombel_id', $user->rombel_id)
                ->latest()
                ->get();
        }

        return Inertia::render('Siswa/ClassroomLinks/Index', [
            'links' => $links,
            'rombel' => $user->rombel ? $user->rombel->name : null,
        ]);
    }
}
