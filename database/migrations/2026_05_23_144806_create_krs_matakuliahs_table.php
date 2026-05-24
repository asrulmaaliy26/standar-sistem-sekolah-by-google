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
        Schema::create('krs_matakuliahs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('krs_period_id')->constrained()->cascadeOnDelete();
            $table->string('kode_mk');
            $table->string('nama_mk');
            $table->string('kelas');
            $table->integer('sks');
            $table->integer('jumlah_mahasiswa')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('krs_matakuliahs');
    }
};
