<?php

namespace App\Traits;

use Illuminate\Support\Facades\Http;
use Illuminate\Broadcasting\Channel;

trait BroadcastsToSocketIO
{
    public function broadcastToSocketIO()
    {
        $channels = $this->broadcastOn();
        $event = $this->broadcastAs();
        $payload = $this->broadcastWith();

        $channels = is_array($channels) ? $channels : [$channels];

        foreach ($channels as $channel) {
            $channelName = $channel instanceof Channel ? $channel->name : $channel;

            Http::post(env('SOCKET_IO_URL', 'http://192.168.43.49:3001') . '/broadcast', [
                'event' => $event,
                'payload' => $payload,
                'channel' => $channelName,
            ]);
        }
    }
}