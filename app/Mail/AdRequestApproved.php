<?php

namespace App\Mail;

use App\Models\AdvertisingRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdRequestApproved extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly AdvertisingRequest $adRequest,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '¡Tu publicación en MenuGo ya está activa!',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.ad_request_approved',
            with: [
                'contactName'   => $this->adRequest->contact_name,
                'businessName'  => $this->adRequest->business_name,
                'type'          => $this->adRequest->type,
                'welcomeUrl'    => url('/'),
            ],
        );
    }
}
