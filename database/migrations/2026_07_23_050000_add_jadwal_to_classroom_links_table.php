<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classroom_links', function (Blueprint $table) {
            $table->string('hari_belajar')->nullable()->after('keterangan'); // e.g. "Senin,Rabu"
            $table->time('jam_mulai')->nullable()->after('hari_belajar');    // e.g. "07:30"
            $table->time('jam_selesai')->nullable()->after('jam_mulai');     // e.g. "09:00"
        });
    }

    public function down(): void
    {
        Schema::table('classroom_links', function (Blueprint $table) {
            $table->dropColumn(['hari_belajar', 'jam_mulai', 'jam_selesai']);
        });
    }
};
