<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Rombel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SiswaAkademikController extends Controller
{
    /**
     * Display a listing of siswa (murid).
     */
    public function index(Request $request)
    {
        $perPageReq = (int) $request->input('per_page', 10);
        $perPage = $perPageReq === 0 ? PHP_INT_MAX : max(1, $perPageReq);
        $search = $request->input('search', '');

        $siswa = User::with('roles', 'rombel')
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['murid', 'siswa']);
            })
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%")
                       ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn($user) => [
                'id'                => $user->id,
                'name'              => $user->name,
                'email'             => $user->email,
                'rombel_id'         => $user->rombel_id,
                'rombel_name'       => $user->rombel ? $user->rombel->name : null,
            ]);

        $rombels = Rombel::with('jenjang:id,nama')->get(['id', 'name', 'jenjang_id']);

        return Inertia::render('Admin/SiswaAkademik/Index', [
            'siswa'   => $siswa,
            'rombels' => $rombels,
            'filters' => [
                'per_page' => $perPageReq,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Assign rombel to siswa.
     */
    public function assignRombel(Request $request, User $siswa)
    {
        if (!$siswa->hasRole('murid') && !$siswa->hasRole('siswa')) {
            return redirect()->back()->with('error', 'User tersebut bukan merupakan Siswa.');
        }

        $validated = $request->validate([
            'rombel_id' => 'required|exists:rombels,id',
        ]);

        $siswa->update(['rombel_id' => $validated['rombel_id']]);

        return redirect()->back()->with('success', "Kelas berhasil diatur untuk {$siswa->name}");
    }

    /**
     * Remove rombel from siswa.
     */
    public function removeRombel(User $siswa)
    {
        if (!$siswa->hasRole('murid') && !$siswa->hasRole('siswa')) {
            return redirect()->back()->with('error', 'User tersebut bukan merupakan Siswa.');
        }

        $siswa->update(['rombel_id' => null]);

        return redirect()->back()->with('success', "Kelas berhasil dihapus dari {$siswa->name}");
    }
}
