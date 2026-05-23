<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NavigationModeController extends Controller
{
    /**
     * Switch the active navigation mode for the authenticated user.
     * Accepts: { type: 'role'|'jabatan', value: string }
     */
    public function switch(Request $request)
    {
        $validated = $request->validate([
            'type'  => ['required', 'in:role,jabatan'],
            'value' => ['required', 'string', 'max:100'],
        ]);

        $user = $request->user();

        // Validate that the user actually has this role/jabatan
        if ($validated['type'] === 'role') {
            if (!$user->roles->pluck('name')->contains($validated['value'])) {
                return back()->withErrors(['value' => 'Role tidak valid untuk user ini.']);
            }
        } elseif ($validated['type'] === 'jabatan') {
            $user->loadMissing('jabatan');
            if (!$user->jabatan->pluck('name')->contains($validated['value'])) {
                return back()->withErrors(['value' => 'Jabatan tidak valid untuk user ini.']);
            }
        }

        $user->setNavigationMode($validated['type'], $validated['value']);

        return redirect()->route('dashboard');
    }

    /**
     * Reset navigation mode to default (primary role).
     */
    public function reset(Request $request)
    {
        $request->user()->resetNavigationMode();

        return redirect()->route('dashboard');
    }
}
