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

class ChallengeCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels, BroadcastsToSocketIO;

    public $challenge;

    public function __construct(Challenge $challenge)
    {
        $this->challenge = $challenge;
    }

    public function broadcastOn()
    {
        // Retourner un tableau avec un ou plusieurs canaux
        return [
            new Channel("private-challenges.user.{$this->challenge->player2_id}"),
            new Channel("private-challenges.{$this->challenge->id}"), // Optionnel, selon votre logique
        ];
    }

    public function broadcastAs()
    {
        return 'challenge.created';
    }

    public function broadcastWith()
    {
        Log::debug("Diffusion de ChallengeCreated", [
            'challenge_id' => $this->challenge->id,
            'channel' => "private-challenges.user.{$this->challenge->player2_id}",
        ]);

        return ['challenge' => $this->challenge->load('player1', 'quizzes')->toArray()];
    }

    public function broadcast()
    {
        $this->broadcastToSocketIO();
    }
}