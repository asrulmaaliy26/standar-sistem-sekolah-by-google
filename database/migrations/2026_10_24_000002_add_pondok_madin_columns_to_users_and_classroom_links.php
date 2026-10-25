<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Santri dipetakan ke 3 jalur: formal (rombel_id, sudah ada), pondok (kamar), madin.
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('kamar_id')->nullable()->after('rombel_id')->constrained('kamars')->nullOnDelete();
            $table->foreignId('madin_kelas_id')->nullable()->after('kamar_id')->constrained('madin_kelas')->nullOnDelete();
            $table->string('nis', 50)->nullable()->after('email');
            $table->enum('jenis_kelamin', ['L', 'P'])->nullable()->after('name');
        });

        // Link Classroom bisa untuk kelas formal (rombel) ATAU kelas Madin.
        Schema::table('classroom_links', function (Blueprint $table) {
            $table->foreignId('rombel_id')->nullable()->change();
            $table->foreignId('madin_kelas_id')->nullable()->after('rombel_id')->constrained('madin_kelas')->cascadeOnDelete();
            $table->enum('kategori', ['formal', 'madin'])->default('formal')->after('madin_kelas_id');
        });
    }

    public function down(): void
    {
        Schema::table('classroom_links', function (Blueprint $table) {
            $table->dropConstrainedForeignId('madin_kelas_id');
            $table->dropColumn('kategori');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('kamar_id');
            $table->dropConstrainedForeignId('madin_kelas_id');
            $table->dropColumn(['nis', 'jenis_kelamin']);
        });
    }
};
