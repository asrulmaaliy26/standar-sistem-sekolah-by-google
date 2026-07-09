<?php

namespace App\Http\Controllers\Persuratan;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Penandatangan;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SertifikatController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Persuratan/Sertifikat/Index', [
            'penandatangans' => Penandatangan::all()->map(function ($p) {
                return [
                    'id' => $p->id,
                    'nama' => $p->nama,
                    'jabatan' => $p->jabatan,
                    'file_ttd' => $p->file_ttd ? Storage::url($p->file_ttd) : null,
                    'file_stempel' => $p->file_stempel ? Storage::url($p->file_stempel) : null,
                ];
            }),
        ]);
    }

    public function storePenandatangan(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'jabatan' => 'required|string|max:255',
            'file_ttd' => 'nullable|image|max:2048',
            'file_stempel' => 'nullable|image|max:2048',
        ]);

        $data = [
            'nama' => $validated['nama'],
            'jabatan' => $validated['jabatan'],
        ];

        if ($request->hasFile('file_ttd')) {
            $data['file_ttd'] = $request->file('file_ttd')->store('signatures', 'public');
        }

        if ($request->hasFile('file_stempel')) {
            $data['file_stempel'] = $request->file('file_stempel')->store('stamps', 'public');
        }

        Penandatangan::create($data);

        return redirect()->back()->with('success', 'Data penandatangan berhasil ditambahkan.');
    }

    public function updatePenandatangan(Request $request, $id)
    {
        $penandatangan = Penandatangan::findOrFail($id);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'jabatan' => 'required|string|max:255',
            'file_ttd' => 'nullable|image|max:2048',
            'file_stempel' => 'nullable|image|max:2048',
        ]);

        $penandatangan->nama = $validated['nama'];
        $penandatangan->jabatan = $validated['jabatan'];

        if ($request->hasFile('file_ttd')) {
            if ($penandatangan->file_ttd) {
                Storage::disk('public')->delete($penandatangan->file_ttd);
            }
            $penandatangan->file_ttd = $request->file('file_ttd')->store('signatures', 'public');
        }

        if ($request->hasFile('file_stempel')) {
            if ($penandatangan->file_stempel) {
                Storage::disk('public')->delete($penandatangan->file_stempel);
            }
            $penandatangan->file_stempel = $request->file('file_stempel')->store('stamps', 'public');
        }

        $penandatangan->save();

        return redirect()->back()->with('success', 'Data penandatangan berhasil diperbarui.');
    }

    public function destroyPenandatangan($id)
    {
        $penandatangan = Penandatangan::findOrFail($id);

        if ($penandatangan->file_ttd) {
            Storage::disk('public')->delete($penandatangan->file_ttd);
        }
        if ($penandatangan->file_stempel) {
            Storage::disk('public')->delete($penandatangan->file_stempel);
        }

        $penandatangan->delete();

        return redirect()->back()->with('success', 'Data penandatangan berhasil dihapus.');
    }

    public function apiPenandatangan()
    {
        $penandatangans = Penandatangan::all()->map(function ($p) {
            return [
                'id' => $p->id,
                'nama' => $p->nama,
                'jabatan' => $p->jabatan,
                'file_ttd' => $p->file_ttd ? Storage::url($p->file_ttd) : null,
                'file_stempel' => $p->file_stempel ? Storage::url($p->file_stempel) : null,
            ];
        });

        // Add CORS headers so PsychoApps can fetch it
        return response()->json($penandatangans)->header('Access-Control-Allow-Origin', '*');
    }

    public function publicSign(Request $request)
    {
        $pdfUrl = $request->query('pdf_url');
        $idPenandatangan = $request->query('id_penandatangan');
        $token = $request->query('token');

        if (!$pdfUrl || !$idPenandatangan || !$token) {
            abort(403, 'Akses Ditolak: Parameter tidak lengkap.');
        }

        // The shared secret key for HMAC (must match PsychoApps)
        $secretKey = env('CERTIFICATE_SIGN_SECRET', 'sertifikat_secret_key_123');

        // Calculate expected token
        $expectedToken = hash_hmac('sha256', $pdfUrl . $idPenandatangan, $secretKey);

        if (!hash_equals($expectedToken, $token)) {
            abort(403, 'Akses Ditolak: Token tidak valid atau link telah dimanipulasi.');
        }

        return Inertia::render('Public/Sertifikat/Sign', [
            'penandatangans' => Penandatangan::all()->map(function ($p) {
                return [
                    'id' => $p->id,
                    'nama' => $p->nama,
                    'jabatan' => $p->jabatan,
                    'file_ttd' => $p->file_ttd ? Storage::url($p->file_ttd) : null,
                    'file_stempel' => $p->file_stempel ? Storage::url($p->file_stempel) : null,
                ];
            }),
            'pdf_url' => $pdfUrl,
            'id_penandatangan' => (int) $idPenandatangan,
        ]);
    }
}
