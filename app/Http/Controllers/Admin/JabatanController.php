<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Jabatan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JabatanController extends Controller
{
    /**
     * Display a listing of jabatan.
     */
    public function index()
    {
        $jabatan = Jabatan::withCount('users')
            ->orderBy('name')
            ->get()
            ->map(fn($j) => [
                'id'          => $j->id,
                'name'        => $j->name,
                'description' => $j->description,
                'users_count' => $j->users_count,
                'created_at'  => $j->created_at->format('Y-m-d H:i'),
            ]);

        return Inertia::render('Admin/Jabatan/Index', [
            'jabatan' => $jabatan,
        ]);
    }

    /**
     * Store a newly created jabatan.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:100|unique:jabatan,name',
            'description' => 'nullable|string|max:255',
        ]);

        Jabatan::create($validated);

        return back()->with('success', 'Jabatan berhasil ditambahkan.');
    }

    /**
     * Update the specified jabatan.
     */
    public function update(Request $request, Jabatan $jabatan)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:100|unique:jabatan,name,' . $jabatan->id,
            'description' => 'nullable|string|max:255',
        ]);

        $jabatan->update($validated);

        return back()->with('success', 'Jabatan berhasil diperbarui.');
    }

    /**
     * Remove the specified jabatan.
     */
    public function destroy(Jabatan $jabatan)
    {
        if ($jabatan->users()->count() > 0) {
            return back()->with('error', 'Jabatan ini masih digunakan oleh ' . $jabatan->users()->count() . ' user.');
        }

        $jabatan->delete();

        return back()->with('success', 'Jabatan berhasil dihapus.');
    }
}
