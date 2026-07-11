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
            $table->string('link_uts')->nullable()->after('link');
            $table->string('link_uas')->nullable()->after('link_uts');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('classroom_links', function (Blueprint $table) {
            $table->dropColumn(['link_uts', 'link_uas']);
        });
    }
};
