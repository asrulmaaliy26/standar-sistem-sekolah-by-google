<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Rombel;
use App\Models\ClassroomLink;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GuruAkademikController extends Controller
{
    /**
     * Display a listing of gurus.
     */
    public function index()
    {
        $gurus = User::with('roles', 'jabatan', 'rombel')
            ->whereHas('roles', function ($query) {
                $query->where('name', 'guru');
            })
            ->paginate(10)
            ->through(fn($user) => [
                'id'                => $user->id,
                'name'              => $user->name,
                'email'             => $user->email,
                'jabatan'           => $user->jabatan->map(fn($j) => ['id' => $j->id, 'name' => $j->name])->values(),
                'rombel_id'         => $user->rombel_id,
                'rombel_name'       => $user->rombel ? $user->rombel->name : null,
            ]);

        $rombels = Rombel::all(['id', 'name']);

        return Inertia::render('Admin/GuruAkademik/Index', [
            'gurus'   => $gurus,
            'rombels' => $rombels,
        ]);
    }

    /**
     * Assign rombel to guru.
     */
    public function assignRombel(Request $request, User $guru)
    {
        // Ensure the user actually has the guru role
        if (!$guru->hasRole('guru')) {
            return redirect()->back()->with('error', 'User tersebut bukan merupakan Guru.');
        }

        $validated = $request->validate([
            'rombel_id' => 'required|exists:rombels,id',
        ]);

        $guru->update(['rombel_id' => $validated['rombel_id']]);

        return redirect()->back()->with('success', "Kelas berhasil diatur untuk {$guru->name}");
    }

    /**
     * Remove rombel from guru.
     */
    public function removeRombel(Request $request, User $guru)
    {
        // Ensure the user actually has the guru role
        if (!$guru->hasRole('guru')) {
            return redirect()->back()->with('error', 'User tersebut bukan merupakan Guru.');
        }

        $guru->update(['rombel_id' => null]);
        
        return redirect()->back()->with('success', "Kelas dihapus dari profil {$guru->name}");
    }

    /**
     * Show guru profile and their classroom links.
     */
    public function show(User $guru)
    {
        if (!$guru->hasRole('guru')) {
            return redirect()->route('admin.guru.index')->with('error', 'User tersebut bukan merupakan Guru.');
        }

        $guru->loadMissing('jabatan', 'rombel');

        $links = ClassroomLink::with('rombel')
            ->where('guru_id', $guru->id)
            ->latest()
            ->get()
            ->map(fn($link) => [
                'id' => $link->id,
                'mapel' => $link->mapel,
                'rombel_id' => $link->rombel_id,
                'rombel_name' => $link->rombel ? $link->rombel->name : 'Unknown',
                'link' => $link->link,
                'keterangan' => $link->keterangan,
                'created_at' => $link->created_at->format('Y-m-d H:i'),
            ]);

        $rombels = Rombel::all(['id', 'name']);

        return Inertia::render('Admin/GuruAkademik/Show', [
            'guru' => [
                'id' => $guru->id,
                'name' => $guru->name,
                'email' => $guru->email,
                'jabatan' => $guru->jabatan->map(fn($j) => $j->name)->implode(', '),
                'rombel_name' => $guru->rombel ? $guru->rombel->name : null,
            ],
            'links' => $links,
            'rombels' => $rombels,
        ]);
    }

    /**
     * Store a new classroom link for the guru.
     */
    public function storeLink(Request $request, User $guru)
    {
        if (!$guru->hasRole('guru')) {
            return redirect()->back()->with('error', 'User tersebut bukan merupakan Guru.');
        }

        $validated = $request->validate([
            'rombel_id' => 'required|exists:rombels,id',
            'mapel' => 'required|string|max:255',
            'link' => 'required|url|max:2000',
            'keterangan' => 'nullable|string|max:1000',
        ]);

        ClassroomLink::create([
            'guru_id' => $guru->id,
            'rombel_id' => $validated['rombel_id'],
            'mapel' => $validated['mapel'],
            'link' => $validated['link'],
            'keterangan' => $validated['keterangan'],
        ]);

        return redirect()->back()->with('success', 'Tautan kelas berhasil ditambahkan.');
    }

    /**
     * Update an existing classroom link.
     */
    public function updateLink(Request $request, ClassroomLink $link)
    {
        $validated = $request->validate([
            'rombel_id' => 'required|exists:rombels,id',
            'mapel' => 'required|string|max:255',
            'link' => 'required|url|max:2000',
            'keterangan' => 'nullable|string|max:1000',
        ]);

        $link->update([
            'rombel_id' => $validated['rombel_id'],
            'mapel' => $validated['mapel'],
            'link' => $validated['link'],
            'keterangan' => $validated['keterangan'],
        ]);

        return redirect()->back()->with('success', 'Tautan kelas berhasil diperbarui.');
    }

    /**
     * Destroy a classroom link.
     */
    public function destroyLink(ClassroomLink $link)
    {
        $link->delete();

        return redirect()->back()->with('success', 'Tautan kelas berhasil dihapus.');
    }
}
