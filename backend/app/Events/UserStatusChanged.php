<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Traits\BroadcastsToSocketIO;

class UserStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels, BroadcastsToSocketIO;

    public $userId;
    public $status;

    public function __construct($userId, $status)
    {
        $this->userId = $userId;
        $this->status = $status;
    }

    public function broadcastOn()
    {
        return [
            new Channel('public-user-status'),
            new Channel("private-user-{$this->userId}"),
        ];
    }

    public function broadcastAs()
    {
        return 'user.status.changed';
    }

    public function broadcastWith()
    {
        return [
            'user_id' => $this->userId,
            'status' => $this->status,
            'timestamp' => now()->toDateTimeString(),
        ];
    }

    public function broadcast()
    {
        $this->broadcastToSocketIO();
    }
}