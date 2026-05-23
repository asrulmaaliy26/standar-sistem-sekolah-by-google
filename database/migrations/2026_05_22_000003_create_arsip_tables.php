<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Kategori arsip — dibuat oleh kepala sekolah
        Schema::create('arsip_kategori', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('color', 7)->default('#3B82F6'); // hex color untuk badge UI
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // File arsip — diupload oleh semua user
        Schema::create('arsip_file', function (Blueprint $table) {
            $table->id();
            $table->foreignId('arsip_kategori_id')->constrained('arsip_kategori')->onDelete('cascade');
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->string('original_name');          // nama file asli
            $table->string('display_name');           // nama tampilan (bisa diubah user)
            $table->string('path')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->string('drive_file_id')->nullable();      // Google Drive file ID
            $table->text('drive_file_url')->nullable();       // link langsung ke Drive
            $table->string('drive_folder_id')->nullable();    // ID folder kategori di Drive
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('arsip_file');
        Schema::dropIfExists('arsip_kategori');
    }
};
