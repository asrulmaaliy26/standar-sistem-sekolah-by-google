<?php

use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\NavigationModeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::post('leave-impersonate', [\App\Http\Controllers\Admin\UserController::class, 'leaveImpersonate'])->name('users.leave-impersonate');

    // Navigation mode switching
    Route::post('navigation/mode', [NavigationModeController::class, 'switch'])->name('navigation.mode.switch');
    Route::post('navigation/mode/reset', [NavigationModeController::class, 'reset'])->name('navigation.mode.reset');
});

require __DIR__ . '/admin.php';
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';

