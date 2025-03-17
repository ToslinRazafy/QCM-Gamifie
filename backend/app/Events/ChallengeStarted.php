<?php

namespace App\Events;

use App\Models\Challenge;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Traits\BroadcastsToSocketIO;
use Illuminate\Support\Facades\Log;


class ChallengeStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels, BroadcastsToSocketIO;

    public $challenge;

    public function __construct(Challenge $challenge)
    {
        $this->challenge = $challenge;
    }

    public function broadcastOn()
    {
        return new Channel("private-challenges.{$this->challenge->id}");
    }

    public function broadcastAs()
    {
        return 'challenge.started';
    }

    public function broadcastWith()
    {
        Log::info("Diffusion de ChallengeStarted - Données", [
        'challenge_id' => $this->challenge->id,
        'player1_id' => $this->challenge->player1_id,
        'player2_id' => $this->challenge->player2_id,
    ]);
    return ['challenge' => $this->challenge->load('player1', 'player2', 'quizzes')->toArray()];
        return ['challenge' => $this->challenge->load('player1', 'player2', 'quizzes')->toArray()];
    }
            public function broadcast()
    {
        $this->broadcastToSocketIO();
    }
}