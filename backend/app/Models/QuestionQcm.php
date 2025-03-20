<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class QuestionQcm extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['qcm_id', 'text', 'type'];

    protected $casts = [
        'type' => 'string',
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

    public function qcm()
    {
        return $this->belongsTo(Qcm::class);
    }

    public function answers()
    {
        return $this->hasMany(AnswerQcm::class);
    }
}