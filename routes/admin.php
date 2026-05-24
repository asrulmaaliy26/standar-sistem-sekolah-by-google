<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\CalendarController;
use App\Http\Controllers\Admin\JenjangController;
use App\Http\Controllers\Admin\GuruAkademikController;
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
                'total_admins' => \App\Models\User::whereHas('roles', fn($q) => $q->where('name', 'superadmin'))->count(),
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
    Route::post('users/{user}/assign-rombel', [\App\Http\Controllers\Admin\UserController::class, 'assignRombel'])->name('users.assign-rombel');
    Route::post('users/{user}/remove-rombel', [\App\Http\Controllers\Admin\UserController::class, 'removeRombel'])->name('users.remove-rombel');

    // Roles Management
    Route::resource('roles', \App\Http\Controllers\Admin\RoleController::class);

    // Jabatan Management
    Route::resource('jabatan', \App\Http\Controllers\Admin\JabatanController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->names('jabatan');


    // Pelanggaran Ujian
    Route::get('pelanggaran', [\App\Http\Controllers\Admin\PelanggaranAdminController::class, 'index'])->name('pelanggaran.index');

});

/**
 * Admin Akademik Routes
 */
Route::middleware(['auth', 'verified', 'admin_akademik'])->prefix('admin')->name('admin.')->group(function () {
    // Manajemen Rombel
    Route::resource('rombels', \App\Http\Controllers\Admin\RombelController::class)
        ->only(['index', 'store', 'update', 'destroy', 'show']);

    // Manajemen Jenjang
    Route::resource('jenjang', JenjangController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->names('jenjang');

    // Data Guru
    Route::get('guru', [GuruAkademikController::class, 'index'])->name('guru.index');
    Route::get('guru/{guru}', [GuruAkademikController::class, 'show'])->name('guru.show');
    Route::post('guru/{guru}/assign-rombel', [GuruAkademikController::class, 'assignRombel'])->name('guru.assign-rombel');
    Route::post('guru/{guru}/remove-rombel', [GuruAkademikController::class, 'removeRombel'])->name('guru.remove-rombel');
    Route::post('guru/{guru}/links', [GuruAkademikController::class, 'storeLink'])->name('guru.store-link');
    Route::put('guru/links/{link}', [GuruAkademikController::class, 'updateLink'])->name('guru.update-link');
    Route::delete('guru/links/{link}', [GuruAkademikController::class, 'destroyLink'])->name('guru.destroy-link');

    // Ploting KRS
    Route::get('krs', [\App\Http\Controllers\Admin\KrsSchedulingController::class, 'index'])->name('krs.index');
    Route::post('krs/period', [\App\Http\Controllers\Admin\KrsSchedulingController::class, 'storePeriod'])->name('krs.period.store');
    Route::post('krs/period/hari-aktif', [\App\Http\Controllers\Admin\KrsSchedulingController::class, 'updateHariAktif'])->name('krs.period.hari_aktif');
    Route::get('krs/template/{type}', [\App\Http\Controllers\Admin\KrsSchedulingController::class, 'downloadTemplate'])->name('krs.template');
    Route::post('krs/import', [\App\Http\Controllers\Admin\KrsSchedulingController::class, 'importCsv'])->name('krs.import');
    Route::post('krs/waktu/generate', [\App\Http\Controllers\Admin\KrsSchedulingController::class, 'generateWaktu'])->name('krs.waktu.generate');
    Route::post('krs/plot', [\App\Http\Controllers\Admin\KrsSchedulingController::class, 'plotOtomatis'])->name('krs.plot');
    Route::put('krs/plot/{id}', [\App\Http\Controllers\Admin\KrsSchedulingController::class, 'updatePlot'])->name('krs.plot.update');
    Route::post('krs/reset', [\App\Http\Controllers\Admin\KrsSchedulingController::class, 'resetPlot'])->name('krs.reset');
    Route::post('krs/reset-all', [\App\Http\Controllers\Admin\KrsSchedulingController::class, 'resetSemuaPlot'])->name('krs.reset_all');
    Route::get('krs/export', [\App\Http\Controllers\Admin\KrsSchedulingController::class, 'exportCsv'])->name('krs.export');
    Route::post('krs/master-data/delete', [\App\Http\Controllers\Admin\KrsSchedulingController::class, 'destroyMasterData'])->name('krs.master_data.delete');
    Route::delete('krs/master-data/{type}/{id}', [\App\Http\Controllers\Admin\KrsSchedulingController::class, 'destroySingleMasterData'])->name('krs.master_data.delete_single');
    Route::put('krs/master-data/dosen/{id}/max-sks', [\App\Http\Controllers\Admin\KrsSchedulingController::class, 'updateDosenMaxSks'])->name('krs.master_data.dosen.update_sks');
    Route::post('krs/master-data/dosen/auto-max-sks', [\App\Http\Controllers\Admin\KrsSchedulingController::class, 'autoCalculateMaxSks'])->name('krs.master_data.dosen.auto_sks');
});

/**
 * Admin Persuratan Routes
 */
Route::middleware(['auth', 'verified', 'admin_persuratan'])->prefix('admin')->name('admin.')->group(function () {
    // Surat Masuk
    Route::resource('surat-masuk', \App\Http\Controllers\Persuratan\SuratMasukController::class)
        ->names('surat-masuk');

    // Surat Keluar
    Route::resource('surat-keluar', \App\Http\Controllers\Persuratan\SuratKeluarController::class)
        ->names('surat-keluar');
});
