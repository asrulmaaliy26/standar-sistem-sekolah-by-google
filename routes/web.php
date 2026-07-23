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
        $user = auth()->user();
        $activeMode = $user->getActiveNavigationMode();
        $roleName = $activeMode['value'] ?? 'user';
        
        $days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        $todayName = $days[\Carbon\Carbon::now()->dayOfWeek];

        $jadwalHariIni = [];
        if ($roleName === 'murid' && $user->rombel_id) {
            $jadwalHariIni = \App\Models\ClassroomLink::with('guru', 'rombel.jenjang')
                ->where('rombel_id', $user->rombel_id)
                ->where('hari_belajar', $todayName)
                ->orderBy('jam_mulai', 'asc')
                ->get();
        } elseif ($roleName === 'guru') {
            $jadwalHariIni = \App\Models\ClassroomLink::with('rombel.jenjang')
                ->where('guru_id', $user->id)
                ->where('hari_belajar', $todayName)
                ->orderBy('jam_mulai', 'asc')
                ->get();
        }

        return Inertia::render('dashboard', [
            'jadwalHariIni' => $jadwalHariIni,
            'hariIni' => $todayName
        ]);
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

// API route for external applications (like PsychoApps) to fetch signatures
Route::get('/api/sertifikat/penandatangan', [\App\Http\Controllers\Persuratan\SertifikatController::class, 'apiPenandatangan']);

// Public route for external applications to sign certificates via HMAC Token
Route::get('/public/sertifikat/sign', [\App\Http\Controllers\Persuratan\SertifikatController::class, 'publicSign'])->name('public.sertifikat.sign');

