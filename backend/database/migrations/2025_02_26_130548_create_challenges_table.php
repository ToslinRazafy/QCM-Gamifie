<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('challenges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('quiz_id')->constrained('quizzes')->onDelete('cascade');
            $table->foreignUuid('player1_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('player2_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['pending', 'active', 'completed'])->default('pending');
            $table->integer('player1_score')->nullable();
            $table->integer('player2_score')->nullable();
            $table->integer('player1_bet')->default(0);
            $table->integer('player2_bet')->default(0);
            $table->foreignUuid('winner_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('challenges');
    }
};