<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQuestionQcmsTable extends Migration
{
    public function up()
    {
        Schema::create('question_qcms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('text');
            $table->enum('type', ['MULTIPLE_CHOICE', 'TRUE_FALSE']);
            $table->timestamps();
            $table->foreignUuid('qcm_id')->constrained('qcms')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('question_qcms');
    }
}