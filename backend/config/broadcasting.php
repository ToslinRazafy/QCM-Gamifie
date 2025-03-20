<?php

return [
    'default' => env('BROADCAST_DRIVER', 'reverb'),

    'connections' => [
        'reverb' => [
            'driver' => 'reverb',
            'key' => env('REVERB_APP_KEY', '5nzab1xjwubribmskoya'),
            'secret' => env('REVERB_APP_SECRET', 'mt5tec6bogfi6lcqsv2l'),
            'app_id' => env('REVERB_APP_ID', '197689'),
            'options' => [
                'host' => env('REVERB_HOST', '192.168.43.49'),
                'port' => env('REVERB_PORT', 8080),
                'scheme' => env('REVERB_SCHEME', 'http'),
                'useTLS' => env('REVERB_SCHEME', 'http') === 'https',
            ],
            'client_options' => [],
        ],

        'log' => [
            'driver' => 'log',
        ],

        'null' => [
            'driver' => 'null',
        ],
    ],
];