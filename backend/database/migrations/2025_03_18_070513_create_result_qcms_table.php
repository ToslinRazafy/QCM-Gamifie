<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateResultQcmsTable extends Migration
{
    public function up()
    {
        Schema::create('result_qcms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->float('score');
            $table->timestamp('submitted_at');
            $table->timestamps();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('examen_id')->constrained('examens')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('result_qcms');
    }
}