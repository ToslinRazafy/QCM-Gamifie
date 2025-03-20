<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Examen extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['title', 'user_id', 'timer', 'status'];

    protected $casts = [
        'timer' => 'integer',
        'status' => 'string',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = Str::uuid();
            }
            if (empty($model->status)) {
                $model->status = 'DRAFT';
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function qcms()
    {
        return $this->belongsToMany(Qcm::class, 'examen_qcms');
    }

    public function results()
    {
        return $this->hasMany(ResultQcm::class);
    }
}