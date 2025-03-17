<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('challenges', function (Blueprint $table) {
            $table->text('shuffled_questions')->nullable()->after('winner_id'); // Stocke les questions mélangées en JSON
            $table->integer('current_question_index')->default(0)->after('shuffled_questions'); // Index de la question actuelle
            $table->uuid('question_answered_by')->nullable()->after('current_question_index'); // ID du joueur ayant répondu en premier
            $table->foreign('question_answered_by')->references('id')->on('users')->onDelete('set null'); // Clé étrangère vers users
        });
    }

    public function down(): void
    {
        Schema::table('challenges', function (Blueprint $table) {
            $table->dropForeign(['question_answered_by']);
            $table->dropColumn(['shuffled_questions', 'current_question_index', 'question_answered_by']);
        });
    }
};