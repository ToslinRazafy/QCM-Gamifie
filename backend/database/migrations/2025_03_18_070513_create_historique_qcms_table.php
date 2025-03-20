<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateHistoriqueQcmsTable extends Migration
{
    public function up()
    {
        Schema::create('historique_qcms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->text('description');
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('historique_qcms');
    }
}