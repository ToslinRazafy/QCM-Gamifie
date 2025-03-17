<?php

namespace App\Events;

use App\Models\Challenge;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Traits\BroadcastsToSocketIO;

class ChallengeAbandoned implements ShouldBroadcast
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
        return 'challenge.abandoned';
    }

    public function broadcastWith()
    {
        return ['challenge' => $this->challenge->load('player1', 'player2', 'winner')->toArray()];
    }
            public function broadcast()
    {
        $this->broadcastToSocketIO();
    }
}