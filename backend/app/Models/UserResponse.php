<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserResponse extends Model
{
    protected $fillable = ['user_id', 'question_id', 'answer_id'];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public $timestamps = false; // Uniquement created_at

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function question()
    {
        return $this->belongsTo(Question::class);
    }

    public function answer()
    {
        return $this->belongsTo(Answer::class);
    }
}