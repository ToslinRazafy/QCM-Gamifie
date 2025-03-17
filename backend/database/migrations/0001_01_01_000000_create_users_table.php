<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('firstname');
            $table->string('lastname')->nullable();
            $table->string('pseudo')->unique();
            $table->string('email')->unique();
            $table->string('avatar')->nullable();
            $table->string('country')->nullable();
            $table->text('bio')->nullable();
            $table->integer('xp')->default(0);
            $table->string('league')->default('Bronze');
            $table->integer('duel_wins')->default(0);
            $table->string('status')->default('offline');
            $table->boolean('is_active')->default(true);
            $table->enum('role', ['ADMIN', 'USER'])->default('USER');
            $table->string('password');
            $table->string('password_reset_token')->nullable();
            $table->timestamp('password_reset_expires_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->index(['xp', 'league']);
        });
        
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('sessions');
    }
};
