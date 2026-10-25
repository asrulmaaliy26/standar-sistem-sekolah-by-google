<?php

use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:guru'])->prefix('guru')->name('guru.')->group(function () {
    // Tautan Classroom
    Route::resource('classroom-links', \App\Http\Controllers\Guru\ClassroomLinkController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Penjaga Ujian (Proctor)
    Route::get('/exam-proctor', [\App\Http\Controllers\Guru\ExamProctorController::class, 'index'])->name('exam-proctor.index');
    Route::post('/exam-proctor/{id}/unlock', [\App\Http\Controllers\Guru\ExamProctorController::class, 'unlock'])->name('exam-proctor.unlock');

    // Pondok Pesantren Guru / Ustadz (Kamar & Setoran)
    Route::get('/pondok', [\App\Http\Controllers\Guru\PondokController::class, 'index'])->name('pondok.index');
    Route::get('/pondok/input-kamar', [\App\Http\Controllers\Guru\PondokController::class, 'inputKamar'])->name('pondok.input-kamar');
    Route::get('/pondok/setoran', [\App\Http\Controllers\Pondok\SetoranController::class, 'index'])->name('pondok.setoran.index');
    Route::post('/pondok/setoran', [\App\Http\Controllers\Guru\PondokController::class, 'storeSetoran'])->name('pondok.setoran.store');
    Route::delete('/pondok/setoran/{id}', [\App\Http\Controllers\Guru\PondokController::class, 'destroySetoran'])->name('pondok.setoran.destroy');

    // Madrasah Diniyah Guru / Ustadz (Kelas Madin & Tautan Diniyah)
    Route::get('/madin', [\App\Http\Controllers\Guru\MadinController::class, 'index'])->name('madin.index');
    Route::post('/madin/links', [\App\Http\Controllers\Guru\MadinController::class, 'storeLink'])->name('madin.links.store');
    Route::put('/madin/links/{link}', [\App\Http\Controllers\Guru\MadinController::class, 'updateLink'])->name('madin.links.update');
    Route::delete('/madin/links/{link}', [\App\Http\Controllers\Guru\MadinController::class, 'destroyLink'])->name('madin.links.destroy');
});
