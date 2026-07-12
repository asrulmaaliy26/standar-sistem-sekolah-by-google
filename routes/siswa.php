<?php

use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:murid'])->prefix('siswa')->name('siswa.')->group(function () {
    // Profil Siswa (pilih rombel)
    Route::post('/profile/rombel', [\App\Http\Controllers\Siswa\ProfileController::class, 'updateRombel'])->name('profile.rombel');
    Route::post('/profile/verify-card', [\App\Http\Controllers\Siswa\ProfileController::class, 'verifyCard'])->name('profile.verify-card');

    // Daftar Kelas (Classroom Links)
    Route::get('/classroom-links', [\App\Http\Controllers\Siswa\ClassroomLinkController::class, 'index'])->name('classroom-links.index');
    // Ujian (CBT)
    Route::get('/exam/{link}/{type}', [\App\Http\Controllers\Siswa\ExamController::class, 'play'])->name('exam.play');
    Route::post('/exam/{link}/{type}/violation', [\App\Http\Controllers\Siswa\ExamController::class, 'reportViolation'])->name('exam.violation');
    Route::post('/exam/{link}/{type}/finish', [\App\Http\Controllers\Siswa\ExamController::class, 'finish'])->name('exam.finish');
});
