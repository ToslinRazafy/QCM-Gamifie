<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Support\Str;
use App\Events\UserStatusChanged;

class User extends Authenticatable implements JWTSubject
{
    use Notifiable;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'firstname',
        'lastname',
        'pseudo',
        'email',
        'avatar',
        'country',
        'bio',
        'xp',
        'league',
        'duel_wins',
        'role',
        'is_active',
        'status',
        'password',
        'password_reset_token',
        'password_reset_expires_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'password_reset_token',
        'password_reset_expires_at',
    ];

    protected $casts = [
        'xp' => 'integer',
        'duel_wins' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'password_reset_expires_at' => 'datetime',
        'status' => 'string',
    ];

   protected static function boot()
    {
        parent::boot();
        static::creating(function ($user) {
            if (empty($user->id)) {
                $user->id = Str::uuid();
            }
            if (empty($user->status)) {
                $user->status = 'offline';
            }
        });

        static::updating(function ($user) {
            if ($user->isDirty('status')) {
                event(new UserStatusChanged($user->id, $user->status));
            }
        });
    }

    public function setStatus(string $status)
    {
        $this->update(['status' => $status]);
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class);
    }

    public function userResponses()
    {
        return $this->hasMany(UserResponse::class);
    }

    public function challengesAsPlayer1()
    {
        return $this->hasMany(Challenge::class, 'player1_id');
    }

    public function challengesAsPlayer2()
    {
        return $this->hasMany(Challenge::class, 'player2_id');
    }

    public function wonChallenges()
    {
        return $this->hasMany(Challenge::class, 'winner_id');
    }

    public function badges()
    {
        return $this->belongsToMany(Badge::class, 'user_badges')->withPivot('earned_at');
    }

    public function history()
    {
        return $this->hasMany(History::class);
    }

    public function friends()
    {
        return $this->hasMany(Friend::class, 'user_id');
    }

    public function friendOf()
    {
        return $this->hasMany(Friend::class, 'friend_id');
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function isAdmin()
    {
        return $this->role === 'ADMIN';
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return ['role' => $this->role];
    }
}