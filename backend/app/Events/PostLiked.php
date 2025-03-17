<?php

namespace App\Events;

use App\Models\Like;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Traits\BroadcastsToSocketIO;

class PostLiked implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels, BroadcastsToSocketIO;

    public $like;

    public function __construct(Like $like)
    {
        $this->like = $like;
    }

    public function broadcastOn()
    {
        return new Channel('posts');
    }

    public function broadcastAs()
    {
        return 'post.liked';
    }

    public function broadcastWith()
    {
        return [
            'like' => $this->like->toArray(),
            'post_id' => $this->like->post_id,
            'user_id' => $this->like->user_id,
        ];
    }
            public function broadcast()
    {
        $this->broadcastToSocketIO();
    }
}