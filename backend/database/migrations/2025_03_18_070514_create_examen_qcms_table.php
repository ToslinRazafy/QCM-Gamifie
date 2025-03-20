<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateExamenQcmsTable extends Migration
{
    public function up()
    {
        Schema::create('examen_qcms', function (Blueprint $table) {
            $table->foreignUuid('examen_id')->constrained('examens')->onDelete('cascade');
            $table->foreignUuid('qcm_id')->constrained('qcms')->onDelete('cascade');
                        $table->primary(['examen_id', 'qcm_id']);
                        
        });
    }

    public function down()
    {
        Schema::dropIfExists('examen_qcms');
    }
}