<?php

namespace App\Events;

use App\Models\Challenge;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Traits\BroadcastsToSocketIO;

class QuestionAnswered implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels, BroadcastsToSocketIO;

    public $challenge;
    public $userId;
    public $answerId;

    public function __construct(Challenge $challenge, $userId, $answerId)
    {
        $this->challenge = $challenge;
        $this->userId = $userId;
        $this->answerId = $answerId;
    }

    public function broadcastOn()
    {
        return new Channel("private-challenges.{$this->challenge->id}");
    }

    public function broadcastAs()
    {
        return 'question.answered';
    }

    public function broadcastWith()
    {
        return [
            'challenge' => $this->challenge->only(['id', 'player1_score', 'player2_score', 'question_answered_by']),
            'user_id' => $this->userId,
            'answer_id' => $this->answerId,
        ];
    }

            public function broadcast()
    {
        $this->broadcastToSocketIO();
    }
}