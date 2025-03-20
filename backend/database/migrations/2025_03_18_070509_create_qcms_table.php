<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQcmsTable extends Migration
{
    public function up()
    {
        Schema::create('qcms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->foreignUuid('category_qcm_id')->constrained('category_q_c_m_s')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('qcms');
    }
}