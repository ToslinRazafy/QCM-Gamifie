<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateChallengeQuizTable extends Migration
{
    public function up()
    {
        Schema::create('challenge_quizs', function (Blueprint $table) {
            $table->uuid('challenge_id');
            $table->unsignedBigInteger('quiz_id');
            $table->foreign('challenge_id')->references('id')->on('challenges')->onDelete('cascade');
            $table->foreign('quiz_id')->references('id')->on('quizzes')->onDelete('cascade');
            $table->primary(['challenge_id', 'quiz_id']);
        });

        // Supprimer l'ancienne colonne quiz_id si elle existe encore
        Schema::table('challenges', function (Blueprint $table) {
            if (Schema::hasColumn('challenges', 'quiz_id')) {
                $table->dropForeign(['quiz_id']);
                $table->dropColumn('quiz_id');
            }
        });
    }

    public function down()
    {
        Schema::dropIfExists('challenge_quizs');

        // Restaurer l'ancienne colonne si nécessaire
        Schema::table('challenges', function (Blueprint $table) {
            $table->unsignedBigInteger('quiz_id')->nullable();
            $table->foreign('quiz_id')->references('id')->on('quizzes')->onDelete('set null');
        });
    }
}