<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUserReponseQcmsTable extends Migration
{
    public function up()
    {
        Schema::create('user_reponse_qcms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('examen_id')->constrained()->onDelete('cascade');
            $table->json('answers'); // Stocke les réponses au format JSON
            $table->integer('score')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('user_reponse_qcms');
    }
}