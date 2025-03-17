<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\CheckRole;
use App\Console\Commands\ResetLeagues;
use App\Http\Middleware\HandleSocketConnection;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);

        $middleware->alias([
            'role' => CheckRole::class,
        ]);

        $middleware->remove(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);
    })
    ->withCommands([ResetLeagues::class])
    ->withSchedule(function ($schedule) {
        $schedule->command('leagues:reset')->cron('0 0 1 */2 *');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();