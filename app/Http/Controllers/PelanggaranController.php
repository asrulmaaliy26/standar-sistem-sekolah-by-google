<?php

namespace App\Http\Controllers;

use App\Models\PelanggaranUjian;
use Illuminate\Http\Request;

class PelanggaranController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nim' => 'nullable|string',
            'nama_siswa' => 'nullable|string',
            'jenis_pelanggaran' => 'required|string',
        ]);

        PelanggaranUjian::create($validated);

        return response()->json(['success' => true]);
    }
}
