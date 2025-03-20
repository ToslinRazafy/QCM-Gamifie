<?php 

namespace App\Events;

use App\Models\Examen;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use App\Traits\BroadcastsToSocketIO;

class ExamenPublished implements ShouldBroadcast
{
    use BroadcastsToSocketIO;

    public $examen;

    public function __construct(Examen $examen)
    {
        $this->examen = $examen;
    }

    public function broadcastOn()
    {
        return new Channel('examens');
    }

    public function broadcastAs()
    {
        return 'examen.updated';
    }

    public function broadcastWith()
    {
        return ['examen' => $this->examen->load('qcms')];
    }

    public function broadcast()
    {
        $this->broadcastToSocketIO();
    }
}