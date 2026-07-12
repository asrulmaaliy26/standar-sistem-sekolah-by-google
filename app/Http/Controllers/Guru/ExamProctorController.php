<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\ExamSession;
use App\Models\ClassroomLink;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExamProctorController extends Controller
{
    public function index(Request $request)
    {
        $guruId = $request->user()->id;

        $jenjangId = $request->get('jenjang_id');
        $rombelId = $request->get('rombel_id');

        $query = ExamSession::with(['user:id,name', 'classroomLink:id,mapel,rombel_id', 'classroomLink.rombel:id,name,jenjang_id'])
            ->whereHas('classroomLink', function ($q) use ($guruId, $rombelId, $jenjangId) {
                $q->where('guru_id', $guruId);
                if ($rombelId) {
                    $q->where('rombel_id', $rombelId);
                } else if ($jenjangId) {
                    $q->whereHas('rombel', function($q2) use ($jenjangId) {
                        $q2->where('jenjang_id', $jenjangId);
                    });
                }
            });

        $sessions = $query->latest()->get();

        $jenjangs = \App\Models\Jenjang::orderBy('nama')->get(['id', 'nama']);
        
        // Ambil rombel yang sesuai jenjang jika jenjang_id ada, atau semua
        $rombelsQuery = \App\Models\Rombel::orderBy('name');
        if ($jenjangId) {
            $rombelsQuery->where('jenjang_id', $jenjangId);
        }
        $rombels = $rombelsQuery->get(['id', 'name', 'jenjang_id']);

        return Inertia::render('Guru/ExamProctor/Index', [
            'sessions' => $sessions,
            'jenjangs' => $jenjangs,
            'rombels' => $rombels,
            'filters' => [
                'jenjang_id' => $jenjangId,
                'rombel_id' => $rombelId,
            ]
        ]);
    }

    public function unlock(Request $request, $sessionId)
    {
        $guruId = $request->user()->id;

        $session = ExamSession::whereHas('classroomLink', function ($query) use ($guruId) {
            $query->where('guru_id', $guruId);
        })->findOrFail($sessionId);

        $session->update([
            'status' => 'active',
            'violation_count' => 0
        ]);

        return back()->with('success', 'Akses ujian siswa berhasil dibuka kembali.');
    }
}
