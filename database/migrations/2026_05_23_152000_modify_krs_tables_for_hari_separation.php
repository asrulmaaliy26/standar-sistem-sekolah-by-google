<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add hari to krs_jadwal_plots
        Schema::table('krs_jadwal_plots', function (Blueprint $table) {
            $table->string('hari')->nullable()->after('krs_ruang_id');
        });

        // Drop hari from krs_waktus
        Schema::table('krs_waktus', function (Blueprint $table) {
            $table->dropColumn('hari');
        });
    }

    public function down(): void
    {
        Schema::table('krs_jadwal_plots', function (Blueprint $table) {
            $table->dropColumn('hari');
        });

        Schema::table('krs_waktus', function (Blueprint $table) {
            $table->string('hari')->nullable();
        });
    }
};
