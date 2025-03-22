<?php

return [
    'default' => env('REVERB_SERVER', 'reverb'),

    'servers' => [
        'reverb' => [
            'host' => env('REVERB_SERVER_HOST', '0.0.0.0'), // Adresse d'écoute
            'port' => env('REVERB_SERVER_PORT', 8080),      // Port d'écoute
            'hostname' => env('REVERB_HOST', 'localhost'),  // Hôte pour les clients
            'options' => [
                'tls' => env('REVERB_SCHEME', 'http') === 'https' ? [
                    'local_cert' => env('REVERB_TLS_CERT'),
                    'local_pk' => env('REVERB_TLS_KEY'),
                ] : [],
            ],
            'max_request_size' => env('REVERB_MAX_REQUEST_SIZE', 10000),
            'scaling' => [
                'enabled' => false, // Désactiver Redis
            ],
            'pulse_ingest_interval' => env('REVERB_PULSE_INGEST_INTERVAL', 10),
            'telescope_ingest_interval' => env('REVERB_TELESCOPE_INGEST_INTERVAL', 10),
        ],
    ],

    'apps' => [
        'provider' => 'config',
        'apps' => [
            [
                'key' => env('REVERB_APP_KEY', '5nzab1xjwubribmskoya'),
                'secret' => env('REVERB_APP_SECRET', 'mt5tec6bogfi6lcqsv2l'),
                'app_id' => env('REVERB_APP_ID', '197689'),
                'options' => [
                    'host' => env('REVERB_HOST', 'localhost'),
                    'port' => env('REVERB_PORT', 8080),
                    'scheme' => env('REVERB_SCHEME', 'http'),
                    'useTLS' => env('REVERB_SCHEME', 'http') === 'https',
                ],
                'allowed_origins' => ['http://localhost:3000', env('APP_URL')], // Origines autorisées
                'ping_interval' => env('REVERB_APP_PING_INTERVAL', 25),
                'activity_timeout' => env('REVERB_APP_ACTIVITY_TIMEOUT', 30),
                'max_message_size' => env('REVERB_APP_MAX_MESSAGE_SIZE', 10000),
            ],
        ],
    ],
];
