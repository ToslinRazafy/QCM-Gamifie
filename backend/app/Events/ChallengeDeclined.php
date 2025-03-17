<?php

namespace App\Events;

use App\Models\Challenge;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use App\Traits\BroadcastsToSocketIO;

class ChallengeDeclined implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels, BroadcastsToSocketIO;

    public $challenge;

    public function __construct(Challenge $challenge)
    {
        $this->challenge = $challenge;
    }

    public function broadcastOn()
    {
        return [
            new Channel("private-challenges.{$this->challenge->id}"),
            new Channel("private-challenges.user.{$this->challenge->player1_id}"),
        ];
    }

    public function broadcastAs()
    {
        return 'challenge.declined';
    }

    public function broadcastWith()
    {
        Log::info("Diffusion de ChallengeDeclined", [
            'challenge_id' => $this->challenge->id,
            'player1_id' => $this->challenge->player1_id,
        ]);

        return ['challenge' => $this->challenge->toArray()];
    }
            public function broadcast()
    {
        $this->broadcastToSocketIO();
    }
}