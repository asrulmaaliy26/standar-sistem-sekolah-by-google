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
        Schema::table('arsip_file', function (Blueprint $table) {
            $table->string('visibility')->default('public')->after('arsip_kategori_id')->comment('public, guru, private');
            $table->foreignId('google_drive_account_id')->nullable()->after('visibility')->constrained('google_drive_accounts')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('arsip_file', function (Blueprint $table) {
            $table->dropForeign(['google_drive_account_id']);
            $table->dropColumn(['visibility', 'google_drive_account_id']);
        });
    }
};
