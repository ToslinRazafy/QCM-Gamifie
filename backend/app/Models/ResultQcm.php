<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ResultQcm extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['user_id', 'examen_id', 'score', 'submitted_at'];

    protected $casts = [
        'score' => 'float',
        'submitted_at' => 'datetime',
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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function examen()
    {
        return $this->belongsTo(Examen::class);
    }
}