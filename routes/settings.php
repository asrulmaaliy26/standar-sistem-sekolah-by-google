<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', 'settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');

    // Google Drive Accounts
    Route::get('settings/drive', function () {
        // Hanya superadmin yang bisa melihat ini
        if (!auth()->user()->hasRole('superadmin')) {
            abort(403);
        }
        return Inertia::render('settings/Drive', [
            'accounts' => \App\Models\GoogleDriveAccount::orderBy('email')->get()
        ]);
    })->name('settings.drive');

    Route::delete('settings/drive/{id}', function ($id) {
        if (!auth()->user()->hasRole('superadmin')) {
            abort(403);
        }
        \App\Models\GoogleDriveAccount::findOrFail($id)->delete();
        return back()->with('success', 'Akun Drive berhasil dihapus.');
    })->name('settings.drive.destroy');
});
