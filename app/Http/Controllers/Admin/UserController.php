<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Jabatan;
use App\Models\Rombel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $users = User::with('roles', 'jabatan')
            ->paginate(10)
            ->through(fn($user) => [
                'id'               => $user->id,
                'name'             => $user->name,
                'email'            => $user->email,
                'email_verified_at'=> $user->email_verified_at,
                'roles'            => $user->roles->pluck('name'),
                'jabatan'          => $user->jabatan->map(fn($j) => ['id' => $j->id, 'name' => $j->name])->values(),
                'created_at'       => $user->created_at->format('Y-m-d H:i'),
            ]);

        $roles   = Role::all(['id', 'name']);
        $jabatan = Jabatan::all(['id', 'name']);

        return Inertia::render('Admin/Users/Index', [
            'users'   => $users,
            'roles'   => $roles,
            'jabatan' => $jabatan,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $roles = Role::all(['id', 'name']);

        return Inertia::render('Admin/Users/Create', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8|confirmed',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'email_verified_at' => now(),
        ]);

        if (!empty($validated['roles'])) {
            $roles = Role::whereIn('id', $validated['roles'])->get();
            foreach ($roles as $role) {
                $user->assignRole($role->name);
            }
        }

        return redirect()->route('admin.users.index')->with('success', 'User created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        $user->loadMissing('roles', 'jabatan');
        return Inertia::render('Admin/Users/Show', [
            'user' => [
                'id'                => $user->id,
                'name'              => $user->name,
                'email'             => $user->email,
                'email_verified_at' => $user->email_verified_at,
                'roles'             => $user->roles->pluck('name'),
                'jabatan'           => $user->jabatan->map(fn($j) => ['id' => $j->id, 'name' => $j->name])->values(),
                'created_at'        => $user->created_at->format('Y-m-d H:i'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        $user->loadMissing('roles', 'jabatan');
        $roles          = Role::all(['id', 'name']);
        $jabatan        = Jabatan::all(['id', 'name']);
        $rombels        = Rombel::all(['id', 'name']);
        $userRoles      = $user->roles->pluck('id')->toArray();
        $userJabatanIds = $user->jabatan->pluck('id')->toArray();

        return Inertia::render('Admin/Users/Edit', [
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'rombel_id' => $user->rombel_id,
            ],
            'roles'          => $roles,
            'jabatan'        => $jabatan,
            'rombels'        => $rombels,
            'userRoles'      => $userRoles,
            'userJabatanIds' => $userJabatanIds,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        // Update roles
        if (isset($validated['roles'])) {
            // Remove all roles
            foreach ($user->roles as $role) {
                $user->removeRole($role->name);
            }

            // Assign new roles
            $roles = Role::whereIn('id', $validated['roles'])->get();
            foreach ($roles as $role) {
                $user->assignRole($role->name);
            }
        }

        return redirect()->route('admin.users.index')->with('success', 'User updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        // Prevent deleting current admin user
        if ($user->id === auth()->id()) {
            return redirect()->route('admin.users.index')->with('error', 'Cannot delete your own account');
        }

        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted successfully');
    }

    /**
     * Impersonate / Bypass login as this user.
     */
    public function impersonate(User $user)
    {
        // Store original admin ID before switching
        $originalId = auth()->id();

        // Login as the selected user
        auth()->login($user);

        // Regenerate session to get a fresh CSRF token, but keep impersonated_by
        request()->session()->regenerate();
        session()->put('impersonated_by', $originalId);

        // Redirect to dashboard (now logged in as the selected user)
        return redirect()->route('dashboard');
    }

    /**
     * Leave impersonation and return to original admin account.
     */
    public function leaveImpersonate()
    {
        if (session()->has('impersonated_by')) {
            $originalId = session()->pull('impersonated_by');

            // Login kembali sebagai admin original
            auth()->loginUsingId($originalId);

            // Regenerate session agar CSRF token segar dan valid
            request()->session()->regenerate();

            return redirect()->route('admin.users.index')->with('success', 'Berhasil kembali ke akun Admin.');
        }

        return redirect()->route('dashboard');
    }

    /**
     * Assign role to user (for AJAX)
     */
    public function assignRole(Request $request, User $user)
    {
        $validated = $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $role = Role::find($validated['role_id']);
        $user->assignRole($role->name);

        return redirect()->back()->with('success', "Role {$role->name} assigned to {$user->name}");
    }

    /**
     * Remove role from user (for AJAX)
     */
    public function removeRole(Request $request, User $user)
    {
        $validated = $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $role = Role::find($validated['role_id']);
        $user->removeRole($role->name);

        return redirect()->back()->with('success', "Role {$role->name} removed from {$user->name}");
    }

    /**
     * Assign jabatan to user.
     */
    public function assignJabatan(Request $request, User $user)
    {
        $validated = $request->validate([
            'jabatan_id' => 'required|exists:jabatan,id',
        ]);

        $jabatan = Jabatan::find($validated['jabatan_id']);
        $user->assignJabatan($jabatan);

        return redirect()->back()->with('success', "Jabatan {$jabatan->name} diberikan ke {$user->name}");
    }

    /**
     * Remove jabatan from user.
     */
    public function removeJabatan(Request $request, User $user)
    {
        $validated = $request->validate([
            'jabatan_id' => 'required|exists:jabatan,id',
        ]);

        $jabatan = Jabatan::find($validated['jabatan_id']);
        $user->removeJabatan($jabatan);

        return redirect()->back()->with('success', "Jabatan {$jabatan->name} dihapus dari {$user->name}");
    }

    /**
     * Assign rombel to user.
     */
    public function assignRombel(Request $request, User $user)
    {
        $validated = $request->validate([
            'rombel_id' => 'required|exists:rombels,id',
        ]);

        $user->update(['rombel_id' => $validated['rombel_id']]);

        return redirect()->back()->with('success', "Kelas berhasil diatur untuk {$user->name}");
    }

    /**
     * Remove rombel from user.
     */
    public function removeRombel(Request $request, User $user)
    {
        $user->update(['rombel_id' => null]);
        return redirect()->back()->with('success', "Kelas dihapus dari profil {$user->name}");
    }
}
