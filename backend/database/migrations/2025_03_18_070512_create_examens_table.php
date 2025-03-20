<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateExamensTable extends Migration
{
    public function up()
    {
        Schema::create('examens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->integer('timer');
            $table->enum('status', ['DRAFT', 'PUBLISHED', 'ENDED'])->default('DRAFT');
            $table->timestamps();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('examens');
    }
}