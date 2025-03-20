<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AnswerQcm extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['question_qcm_id', 'text', 'is_correct'];

    protected $casts = [
        'is_correct' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = Str::uuid();
            }
        });
    }

    public function question()
    {
        return $this->belongsTo(QuestionQcm::class, 'question_qcm_id');
    }
}