<?php

use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:guru'])->prefix('guru')->name('guru.')->group(function () {
    // Tautan Classroom
    Route::resource('classroom-links', \App\Http\Controllers\Guru\ClassroomLinkController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Penjaga Ujian (Proctor)
    Route::get('/exam-proctor', [\App\Http\Controllers\Guru\ExamProctorController::class, 'index'])->name('exam-proctor.index');
    Route::post('/exam-proctor/{id}/unlock', [\App\Http\Controllers\Guru\ExamProctorController::class, 'unlock'])->name('exam-proctor.unlock');
});
