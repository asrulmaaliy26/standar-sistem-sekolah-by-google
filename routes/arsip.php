<?php

use App\Http\Controllers\Arsip\FileController;
use App\Http\Controllers\Arsip\KategoriController;
use Illuminate\Support\Facades\Route;

/**
 * Arsip Routes — semua user terautentikasi bisa akses
 */
Route::middleware(['auth', 'verified'])->prefix('arsip')->name('arsip.')->group(function () {

    // Halaman utama & upload file
    Route::get('/', [FileController::class, 'index'])->name('index');
    Route::post('/upload', [FileController::class, 'store'])->name('upload');
    Route::delete('/{arsipFile}', [FileController::class, 'destroy'])->name('destroy');

    // Kategori (CRUD oleh kepala sekolah/admin)
    Route::get('/kategori', [KategoriController::class, 'index'])->name('kategori.index');
    Route::post('/kategori', [KategoriController::class, 'store'])->name('kategori.store');
    Route::put('/kategori/{kategori}', [KategoriController::class, 'update'])->name('kategori.update');
    Route::delete('/kategori/{kategori}', [KategoriController::class, 'destroy'])->name('kategori.destroy');
});
