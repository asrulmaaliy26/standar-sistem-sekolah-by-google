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
        Schema::create('krs_dosens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('krs_period_id')->constrained()->cascadeOnDelete();
            $table->string('nama_dosen');
            $table->string('kode_mk');
            $table->integer('prioritas')->nullable();
            $table->integer('max_sks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('krs_dosens');
    }
};
