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
        Schema::create('krs_ruangs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('krs_period_id')->constrained()->cascadeOnDelete();
            $table->string('kode_ruang');
            $table->string('nama_ruang');
            $table->integer('kapasitas');
            $table->string('jenis_ruang')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('krs_ruangs');
    }
};
