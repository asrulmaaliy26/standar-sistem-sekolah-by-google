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
        Schema::create('surat_masuks', function (Blueprint $table) {
            $table->id();
            $table->string('no_agenda')->unique();
            $table->string('no_surat')->nullable();
            $table->date('tanggal_surat');
            $table->date('tanggal_terima')->nullable();
            $table->string('pengirim');
            $table->text('perihal');
            $table->enum('sifat', ['Biasa', 'Penting', 'Rahasia'])->default('Biasa');
            $table->string('lampiran')->nullable();
            $table->string('file_surat')->nullable();
            $table->enum('status', ['Baru', 'Diproses', 'Selesai'])->default('Baru');
            $table->timestamps();
        });

        Schema::create('surat_keluars', function (Blueprint $table) {
            $table->id();
            $table->string('no_surat')->unique();
            $table->date('tanggal_surat');
            $table->string('tujuan');
            $table->text('perihal');
            $table->longText('isi_surat')->nullable();
            $table->string('penandatangan')->nullable();
            $table->string('file_surat')->nullable();
            $table->enum('status', ['Draft', 'Dikirim'])->default('Draft');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('surat_keluars');
        Schema::dropIfExists('surat_masuks');
    }
};
