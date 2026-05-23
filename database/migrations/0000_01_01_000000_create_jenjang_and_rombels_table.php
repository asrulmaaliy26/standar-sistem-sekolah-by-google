<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabel jenjang
        Schema::create('jenjang', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('lokasi')->nullable();
            $table->text('deskripsi')->nullable();
            $table->timestamps();
        });

        // Tabel rombels
        Schema::create('rombels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('jenjang_id')->nullable()->constrained('jenjang')->nullOnDelete();
            $table->string('lokasi')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rombels');
        Schema::dropIfExists('jenjang');
    }
};
