<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Challenge extends Model
{
    use HasFactory;

    public $incrementing = false; // Désactive l'auto-incrémentation
    protected $keyType = 'string'; // Définit le type de clé comme string (pour UUID)

    protected $fillable = [
        'id', // Ajout de id dans fillable
        'player1_id',
        'player2_id',
        'status',
        'player1_score',
        'player2_score',
        'player1_bet',
        'player2_bet',
        'winner_id',
        'shuffled_questions',
        'current_question_index',
        'question_answered_by',
    ];

    protected static function boot()
    {
        parent::boot();

        // Générer un UUID automatiquement avant la création
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = Str::uuid()->toString();
            }
        });
    }

    public function player1()
    {
        return $this->belongsTo(User::class, 'player1_id');
    }

    public function player2()
    {
        return $this->belongsTo(User::class, 'player2_id');
    }

    public function winner()
    {
        return $this->belongsTo(User::class, 'winner_id');
    }

    public function quizzes()
    {
        return $this->belongsToMany(Quiz::class, 'challenge_quizs', 'challenge_id', 'quiz_id');
    }
}