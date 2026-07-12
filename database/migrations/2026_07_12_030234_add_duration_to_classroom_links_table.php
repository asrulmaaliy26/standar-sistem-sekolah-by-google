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
        Schema::table('classroom_links', function (Blueprint $table) {
            $table->integer('uts_durasi')->nullable()->after('uts_tutup')->comment('Durasi ujian UTS dalam menit');
            $table->integer('uas_durasi')->nullable()->after('uas_tutup')->comment('Durasi ujian UAS dalam menit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('classroom_links', function (Blueprint $table) {
            $table->dropColumn(['uts_durasi', 'uas_durasi']);
        });
    }
};
