<?php

namespace App\Events;

use App\Models\Friend;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Traits\BroadcastsToSocketIO;

class FriendRequestSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels, BroadcastsToSocketIO;

    public $friendship;

    public function __construct(Friend $friendship)
    {
        $this->friendship = $friendship;
    }

    public function broadcastOn()
    {
        return [
            new Channel("private-friends.{$this->friendship->user_id}"),
            new Channel("private-friends.{$this->friendship->friend_id}"),
        ];
    }

    public function broadcastAs()
    {
        return 'friend.request.sent';
    }

    public function broadcastWith()
    {
        return ['friendship' => $this->friendship->load('user', 'friend')->toArray()];
    }

        public function broadcast()
    {
        $this->broadcastToSocketIO();
    }
}