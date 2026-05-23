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

Route::get('/ujian', function () {
    return Inertia::render('Ujian');
})->name('ujian');

Route::post('/pelanggaran', [\App\Http\Controllers\PelanggaranController::class, 'store'])->name('pelanggaran.store');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::post('leave-impersonate', [\App\Http\Controllers\Admin\UserController::class, 'leaveImpersonate'])->name('users.leave-impersonate');

    // Navigation mode switching
    Route::post('navigation/mode', [NavigationModeController::class, 'switch'])->name('navigation.mode.switch');
    Route::post('navigation/mode/reset', [NavigationModeController::class, 'reset'])->name('navigation.mode.reset');

    // Calendar
    Route::get('/calendar', [\App\Http\Controllers\Admin\CalendarController::class, 'index'])->name('calendar');
    Route::get('/calendar/recap', [\App\Http\Controllers\Admin\CalendarController::class, 'recap'])->name('calendar.recap');
    Route::get('/calendar/events', [\App\Http\Controllers\Admin\CalendarController::class, 'fetchEvents'])->name('calendar.events');
    Route::post('/calendar/events', [\App\Http\Controllers\Admin\CalendarController::class, 'store'])->name('calendar.store');
    Route::post('/calendar/events/{event}/files', [\App\Http\Controllers\Admin\CalendarController::class, 'uploadFiles'])->name('calendar.files.store');
    Route::put('/calendar/events/{event}', [\App\Http\Controllers\Admin\CalendarController::class, 'update'])->name('calendar.update');
    Route::delete('/calendar/events/{event}', [\App\Http\Controllers\Admin\CalendarController::class, 'destroy'])->name('calendar.destroy');
    Route::delete('/calendar/files/{file}', [\App\Http\Controllers\Admin\CalendarController::class, 'deleteFile'])->name('calendar.files.destroy');
});

require __DIR__ . '/admin.php';
require __DIR__ . '/arsip.php';
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/guru.php';
require __DIR__ . '/siswa.php';


