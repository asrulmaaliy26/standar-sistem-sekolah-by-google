<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classroom_links', function (Blueprint $table) {
            $table->date('uts_mulai')->nullable()->after('link_uts');
            $table->date('uts_tutup')->nullable()->after('uts_mulai');
            $table->date('uas_mulai')->nullable()->after('link_uas');
            $table->date('uas_tutup')->nullable()->after('uas_mulai');
        });
    }

    public function down(): void
    {
        Schema::table('classroom_links', function (Blueprint $table) {
            $table->dropColumn(['uts_mulai', 'uts_tutup', 'uas_mulai', 'uas_tutup']);
        });
    }
};
