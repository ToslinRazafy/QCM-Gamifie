<?php

namespace App\Http\Services;

use Illuminate\Mail\Mailable;

class EmailService extends Mailable
{
    public $subject;
    public $content;

    public function __construct($subject, $content)
    {
        $this->subject = $subject;
        $this->content = $content;
    }

    public function build()
    {
        return $this->subject($this->subject)
            ->html($this->content);
    }
}