<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Jadwal setoran yang fleksibel (bisa berubah-ubah)
        Schema::create('pondok_jadwal_setoran', function (Blueprint $table) {
            $table->id();
            $table->string('nama_sesi');
            $table->string('hari', 20)->nullable();   // Senin..Minggu (rutin mingguan)
            $table->date('tanggal')->nullable();       // diisi jika jadwal insidental
            $table->time('waktu_mulai')->nullable();
            $table->time('waktu_selesai')->nullable();
            $table->foreignId('ustadz_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('kamar_id')->nullable()->constrained('kamars')->nullOnDelete();
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
        });

        // Catatan setoran harian per santri
        Schema::create('pondok_setorans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('santri_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('ustadz_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('jadwal_id')->nullable()->constrained('pondok_jadwal_setoran')->nullOnDelete();
            $table->date('tanggal');
            $table->enum('kategori', ['tahfidz_quran', 'tahfidz_hadits', 'kitab', 'amalan']);
            $table->string('kitab_surat')->nullable();
            $table->string('halaman_ayat')->nullable();
            $table->enum('status', ['lancar', 'mengulang', 'kurang_lancar', 'absen'])->default('lancar');
            $table->unsignedTinyInteger('nilai')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->index(['santri_id', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pondok_setorans');
        Schema::dropIfExists('pondok_jadwal_setoran');
    }
};
