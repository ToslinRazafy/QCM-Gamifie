<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class HistoriqueQcm extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['user_id', 'type', 'description'];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public $timestamps = true;

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
}