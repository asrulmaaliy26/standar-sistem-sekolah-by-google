<?php

use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:guru'])->prefix('guru')->name('guru.')->group(function () {
    // Tautan Classroom
    Route::resource('classroom-links', \App\Http\Controllers\Guru\ClassroomLinkController::class)
        ->only(['index', 'store', 'destroy']);
});
