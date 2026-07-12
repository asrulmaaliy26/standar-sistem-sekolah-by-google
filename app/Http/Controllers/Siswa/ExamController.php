<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\ClassroomLink;
use App\Models\ExamSession;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ExamController extends Controller
{
    public function play(Request $request, $linkId, $type)
    {
        $user = $request->user();
        $link = ClassroomLink::findOrFail($linkId);
        
        if (!in_array($type, ['uts', 'uas'])) {
            abort(404);
        }

        // Cek Jadwal
        $now = Carbon::now();
        $mulai = $type === 'uts' ? $link->uts_mulai : $link->uas_mulai;
        $tutup = $type === 'uts' ? $link->uts_tutup : $link->uas_tutup;
        $formLink = $type === 'uts' ? $link->link_uts : $link->link_uas;
        $durasi = $type === 'uts' ? $link->uts_durasi : $link->uas_durasi;

        if (!$formLink) {
            return back()->with('error', 'Link ujian belum disetel oleh guru.');
        }

        if (!$mulai || !$tutup || $now->lt(Carbon::parse($mulai)) || $now->gt(Carbon::parse($tutup)->endOfDay())) {
            return back()->with('error', 'Ujian belum dimulai atau sudah ditutup.');
        }

        // Cek atau Buat Sesi
        $session = ExamSession::firstOrCreate(
            ['user_id' => $user->id, 'classroom_link_id' => $link->id, 'exam_type' => $type],
            ['status' => 'active', 'violation_count' => 0]
        );

        if ($session->status === 'blocked') {
            return back()->with('error', 'Akses ujian Anda telah diblokir karena melakukan pelanggaran. Silakan hubungi pengawas ujian.');
        }
        
        // Cek Durasi (Backend Protection)
        if ($durasi && $session->status === 'active') {
            $endTime = Carbon::parse($session->started_at)->addMinutes($durasi);
            if ($now->gt($endTime)) {
                $session->update(['status' => 'finished', 'finished_at' => $now]);
                return back()->with('error', 'Waktu ujian Anda telah habis.');
            }
        }

        if ($session->status === 'finished') {
            return back()->with('error', 'Anda telah menyelesaikan ujian ini.');
        }

        return Inertia::render('Siswa/ClassroomLinks/CbtPlayer', [
            'exam' => [
                'id' => $link->id,
                'type' => $type,
                'mapel' => $link->mapel,
                'url' => $formLink,
                'session_id' => $session->id,
                'violation_count' => $session->violation_count,
                'started_at' => $session->started_at,
                'durasi' => $durasi,
            ]
        ]);
    }

    public function reportViolation(Request $request, $linkId, $type)
    {
        $user = $request->user();
        $session = ExamSession::where('user_id', $user->id)
            ->where('classroom_link_id', $linkId)
            ->where('exam_type', $type)
            ->firstOrFail();

        if ($session->status === 'active') {
            $session->violation_count += 1;
            
            // Beri toleransi 2x, blokir pada ke-3
            if ($session->violation_count >= 3) {
                $session->status = 'blocked';
            }
            $session->save();
        }

        return response()->json([
            'status' => $session->status,
            'violation_count' => $session->violation_count
        ]);
    }

    public function finish(Request $request, $linkId, $type)
    {
        $user = $request->user();
        $session = ExamSession::where('user_id', $user->id)
            ->where('classroom_link_id', $linkId)
            ->where('exam_type', $type)
            ->firstOrFail();

        $session->update([
            'status' => 'finished',
            'finished_at' => Carbon::now()
        ]);

        return redirect()->route('siswa.classroom-links.index')->with('success', 'Ujian telah selesai.');
    }
}
