<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\CalendarController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/**
 * Admin Routes - Protected with admin middleware
 */
Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    // Admin Dashboard
    Route::get('/dashboard', function () {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_users' => \App\Models\User::count(),
                'total_roles' => \App\Models\Role::count(),
                'total_admins' => \App\Models\User::whereHas('roles', fn($q) => $q->where('name', 'admin'))->count(),
            ],
        ]);
    })->name('dashboard');

    // Users Management
    Route::resource('users', \App\Http\Controllers\Admin\UserController::class);
    Route::post('users/{user}/assign-role', [\App\Http\Controllers\Admin\UserController::class, 'assignRole'])->name('users.assign-role');
    Route::post('users/{user}/remove-role', [\App\Http\Controllers\Admin\UserController::class, 'removeRole'])->name('users.remove-role');
    Route::post('users/{user}/impersonate', [\App\Http\Controllers\Admin\UserController::class, 'impersonate'])->name('users.impersonate');
    Route::post('users/{user}/assign-jabatan', [\App\Http\Controllers\Admin\UserController::class, 'assignJabatan'])->name('users.assign-jabatan');
    Route::post('users/{user}/remove-jabatan', [\App\Http\Controllers\Admin\UserController::class, 'removeJabatan'])->name('users.remove-jabatan');

    // Roles Management
    Route::resource('roles', \App\Http\Controllers\Admin\RoleController::class);

    // Jabatan Management
    Route::resource('jabatan', \App\Http\Controllers\Admin\JabatanController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->names('jabatan');

    // Calendar
    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar');
    Route::get('/calendar/recap', [CalendarController::class, 'recap'])->name('calendar.recap');
    Route::get('/calendar/events', [CalendarController::class, 'fetchEvents'])->name('calendar.events');
    Route::post('/calendar/events', [CalendarController::class, 'store'])->name('calendar.store');
    Route::post('/calendar/events/{event}/files', [CalendarController::class, 'uploadFiles'])->name('calendar.files.store');
    Route::put('/calendar/events/{event}', [CalendarController::class, 'update'])->name('calendar.update');
    Route::delete('/calendar/events/{event}', [CalendarController::class, 'destroy'])->name('calendar.destroy');
    Route::delete('/calendar/files/{file}', [CalendarController::class, 'deleteFile'])->name('calendar.files.destroy');
});
