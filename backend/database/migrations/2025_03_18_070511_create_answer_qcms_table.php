<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAnswerQcmsTable extends Migration
{
    public function up()
    {
        Schema::create('answer_qcms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('text');
            $table->boolean('is_correct');
            $table->timestamps();
            $table->foreignUuid('question_qcm_id')->constrained('question_qcms')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('answer_qcms');
    }
}