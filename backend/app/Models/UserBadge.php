<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class UserBadge extends Pivot
{
    protected $table = 'user_badges';

    protected $fillable = ['user_id', 'badge_id', 'earned_at'];

    protected $casts = [
        'earned_at' => 'datetime',
    ];

    public $timestamps = false;
}