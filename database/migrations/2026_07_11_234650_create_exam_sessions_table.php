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
        Schema::create('exam_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('classroom_link_id')->constrained()->cascadeOnDelete();
            $table->enum('exam_type', ['uts', 'uas']);
            $table->enum('status', ['active', 'blocked', 'finished'])->default('active');
            $table->integer('violation_count')->default(0);
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
            
            // Seorang siswa hanya punya 1 sesi per ujian
            $table->unique(['user_id', 'classroom_link_id', 'exam_type'], 'exam_session_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_sessions');
    }
};
