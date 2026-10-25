<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Master kamar / asrama pondok
        Schema::create('kamars', function (Blueprint $table) {
            $table->id();
            $table->string('nama_kamar');
            $table->string('gedung')->nullable();
            $table->unsignedInteger('kapasitas')->nullable();
            $table->enum('gender', ['L', 'P'])->nullable();
            $table->foreignId('pembina_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });

        // Master kelas Madrasah Diniyah (dibuat sendiri oleh admin)
        Schema::create('madin_kelas', function (Blueprint $table) {
            $table->id();
            $table->string('nama_kelas');
            $table->string('tingkat')->nullable(); // Ula / Wustho / Ulya
            $table->foreignId('wali_kelas_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('deskripsi')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('madin_kelas');
        Schema::dropIfExists('kamars');
    }
};
