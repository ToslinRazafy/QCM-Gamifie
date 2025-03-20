<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Qcm extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['title', 'category_qcm_id', 'description'];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = Str::uuid();
            }
        });
    }

    public function categoryQcm()
    {
        return $this->belongsTo(CategoryQCM::class, 'category_qcm_id');
    }

    public function questions()
    {
        return $this->hasMany(QuestionQcm::class);
    }

    public function examens()
    {
        return $this->belongsToMany(Examen::class, 'examen_qcms');
    }
}