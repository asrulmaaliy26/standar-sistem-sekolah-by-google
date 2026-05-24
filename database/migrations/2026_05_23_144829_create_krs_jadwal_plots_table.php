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
        Schema::create('krs_jadwal_plots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('krs_period_id')->constrained()->cascadeOnDelete();
            $table->foreignId('krs_matakuliah_id')->constrained()->cascadeOnDelete();
            $table->foreignId('krs_dosen_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('krs_ruang_id')->nullable()->constrained()->nullOnDelete();
            // Since time blocks can be combined, we might need a relationship or a string of ids. 
            // The simplest way to handle combined time blocks is to store them as a JSON array.
            $table->json('krs_waktu_ids')->nullable(); 
            $table->boolean('is_conflict')->default(false);
            $table->text('conflict_message')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('krs_jadwal_plots');
    }
};
