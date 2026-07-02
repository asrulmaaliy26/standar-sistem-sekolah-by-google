<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('krs_waktus', function (Blueprint $table) {
            $table->boolean('is_istirahat')->default(false)->after('durasi_menit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('krs_waktus', function (Blueprint $table) {
            $table->dropColumn('is_istirahat');
        });
    }
};
