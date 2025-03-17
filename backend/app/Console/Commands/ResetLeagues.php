<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\History;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ResetLeagues extends Command
{
    protected $signature = 'leagues:reset';
    protected $description = 'Reset XP and leagues every 2 months';

    public function handle()
    {
        DB::transaction(function () {
            $users = User::all();

            foreach ($users as $user) {
                $oldXp = $user->xp;
                $user->xp = (int)($user->xp * 0.5);
                $oldLeague = $user->league;
                $this->updateLeague($user);
                $user->save();

                if ($oldXp > $user->xp) {
                    History::create([
                        'user_id' => $user->id,
                        'type' => 'xp',
                        'description' => 'Seasonal reset',
                        'value' => $user->xp - $oldXp,
                    ]);
                }
                if ($oldLeague !== $user->league) {
                    History::create([
                        'user_id' => $user->id,
                        'type' => 'league',
                        'description' => "Demoted to $user->league",
                    ]);
                }
            }
        });

        Log::info('Leagues reset successfully.');
        $this->info('Leagues reset completed.');
    }

    private function updateLeague(User $user)
    {
        $leagues = config('leagues');
        $newLeague = 'Bronze';
        foreach ($leagues as $league => $range) {
            if ($user->xp >= $range['min_xp'] && ($range['max_xp'] === null || $user->xp <= $range['max_xp'])) {
                $newLeague = $league;
                break;
            }
        }
        $user->league = $newLeague;
    }
}