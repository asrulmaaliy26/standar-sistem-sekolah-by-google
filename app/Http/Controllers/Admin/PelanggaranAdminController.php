<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PelanggaranUjian;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PelanggaranAdminController extends Controller
{
    public function index(Request $request)
    {
        $query = PelanggaranUjian::query();

        if ($request->has('search') && $request->search) {
            $query->where('nim', 'like', '%' . $request->search . '%')
                  ->orWhere('nama_siswa', 'like', '%' . $request->search . '%')
                  ->orWhere('jenis_pelanggaran', 'like', '%' . $request->search . '%');
        }

        $pelanggarans = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Admin/Pelanggaran/Index', [
            'pelanggarans' => $pelanggarans,
            'filters' => $request->only(['search']),
        ]);
    }
}
