<?php

namespace App\Events;

use App\Models\Friend;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Traits\BroadcastsToSocketIO;

class FriendRequestResponded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels, BroadcastsToSocketIO;

    public $friendship;
    public $response;

    public function __construct(Friend $friendship, string $response)
    {
        $this->friendship = $friendship;
        $this->response = $response;
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
        return 'friend.request.responded';
    }

    public function broadcastWith()
    {
        return [
            'friendship' => $this->friendship->load('user', 'friend')->toArray(),
            'response' => $this->response,
        ];
    }

    public function broadcast()
    {
        $this->broadcastToSocketIO();
    }
}