<?php

namespace App\Http\Controllers;

use App\Events\ChallengeCreated;
use App\Events\ChallengeAccepted;
use App\Events\ChallengeStarted;
use App\Events\ChallengeCompleted;
use App\Events\ChallengeCancelled;
use App\Events\ChallengeDeclined;
use App\Events\ChallengeAbandoned;
use App\Events\QuestionAnswered;
use App\Events\NextQuestion;
use App\Models\Answer;
use App\Models\Badge;
use App\Models\Challenge;
use App\Models\History;
use App\Models\Post;
use App\Models\Quiz;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;


class ChallengeController extends Controller
{
    public function invite(Request $request)
    {
        $data = $request->validate([
            'opponent_id' => 'required|exists:users,id|different:' . auth()->id(),
            'bet' => 'required|integer|min:25',
        ]);

        $user = auth()->user();
        $opponent = User::findOrFail($data['opponent_id']);

        if ($opponent->status !== 'online') {
            return response()->json(['error' => 'L’adversaire doit être en ligne pour recevoir un défi'], 403);
        }

        if ($user->xp < 25) {
            return response()->json(['error' => 'Vous devez avoir au moins 25 XP pour créer un défi'], 403);
        }

        $maxBet = min($user->xp, $opponent->xp);
        if ($data['bet'] > $maxBet) {
            return response()->json(['error' => "La mise ne peut dépasser $maxBet XP"], 422);
        }

        try {
            $challenge = DB::transaction(function () use ($data, $user) {
                $quizzes = Quiz::inRandomOrder()->limit(5)->with('questions.answers')->get();
                if ($quizzes->count() < 5) {
                    throw new \Exception('Pas assez de quizzes disponibles.');
                }

                $allQuestions = $quizzes->flatMap(function ($quiz) {
                    if (!is_object($quiz) || !$quiz instanceof Quiz) {
                        Log::error("Quiz invalide détecté", ['quiz' => $quiz]);
                        throw new \Exception('Quiz invalide détecté.');
                    }
                    $shuffledQuestions = $quiz->questions->shuffle();
                    return $shuffledQuestions->map(function ($question) {
                        $question->answers = $question->answers->shuffle();
                        return $question->only(['id', 'text', 'time_limit', 'answers']);
                    });
                })->values()->toArray();

                $challenge = Challenge::create([
                    'id' => Str::uuid()->toString(),
                    'player1_id' => $user->id,
                    'player2_id' => $data['opponent_id'],
                    'player1_bet' => $data['bet'],
                    'player2_bet' => $data['bet'],
                    'status' => 'pending',
                    'shuffled_questions' => json_encode($allQuestions),
                    'current_question_index' => 0,
                    'player1_score' => 0,
                    'player2_score' => 0,
                ]);

                $quizIds = $quizzes->pluck('id')->toArray();
                if (empty($quizIds)) {
                    throw new \Exception('Aucun ID de quiz valide trouvé.');
                }
                $challenge->quizzes()->attach($quizIds);

                $a = User::findOrFail($data['opponent_id']);
                History::create([
                    'user_id' => $user->id,
                    'type' => 'challenge',
                    'description' => "Défi envoyé à # $a->pseudo",
                    'value' => $data['bet'],
                ]);

                return $challenge;
            });

            Log::info("Avant chargement des relations", [
                'challenge_id' => $challenge->id,
                'player1_id' => $challenge->player1_id,
                'player2_id' => $challenge->player2_id,
            ]);

            $challenge->load('player1', 'quizzes');
            if (!$challenge->player1) {
                Log::error("Échec du chargement de player1", ['player1_id' => $challenge->player1_id]);
                throw new \Exception('Erreur lors du chargement de player1');
            }
            if ($challenge->quizzes->isEmpty()) {
                Log::error("Échec du chargement des quizzes", ['challenge_id' => $challenge->id]);
                throw new \Exception('Erreur lors du chargement des quizzes');
            }

            Log::info("Données avant diffusion", [
                'challenge_id' => $challenge->id,
                'player1' => $challenge->player1->toArray(),
                'quizzes' => $challenge->quizzes->toArray(),
            ]);

            (new ChallengeCreated($challenge))->broadcast();

            Log::info("Après diffusion de ChallengeCreated", [
                'challenge_id' => $challenge->id,
                'player1_id' => $user->id,
                'player2_id' => $challenge->player2_id,
            ]);

            return response()->json($challenge, 201);
        } catch (\Exception $e) {
            Log::error("Erreur lors de la création du défi", [
                'user_id' => $user->id,
                'opponent_id' => $data['opponent_id'],
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function accept(Request $request, $challengeId)
    {
        $challenge = Challenge::findOrFail($challengeId);
        $user = auth()->user();

        if ($challenge->player2_id !== $user->id || $challenge->status !== 'pending') {
            return response()->json(['error' => 'Invalid challenge'], 403);
        }

        if ($user->xp < 25) {
            return response()->json(['error' => 'Vous devez avoir au moins 25 XP pour accepter un défi'], 403);
        }

        if ($user->xp < $challenge->player2_bet) {
            return response()->json(['error' => 'XP insuffisant pour accepter'], 422);
        }

        DB::transaction(function () use ($challenge, $user) {
            $player1 = User::findOrFail($challenge->player1_id);
            $player1->xp -= $challenge->player1_bet;
            $user->xp -= $challenge->player2_bet;
            $player1->save();
            $user->save();

            $challenge->status = 'active';
            $challenge->current_question_index = 0;
            $challenge->player1_score = 0;
            $challenge->player2_score = 0;
            $challenge->save();

            History::create([
                'user_id' => $user->id,
                'type' => 'challenge',
                'description' => "Défi #$user->pseudo accepté",
                'value' => -$challenge->player2_bet,
            ]);
            History::create([
                'user_id' => $player1->id,
                'type' => 'xp',
                'description' => "Mise de {$challenge->player1_bet} XP pour défi #$user->pseudo",
                'value' => -$challenge->player1_bet,
            ]);

            // Diffusion des événements avec logs supplémentaires
            Log::info("Avant diffusion de ChallengeAccepted", [
                'challenge_id' => $challenge->id,
                'player1_id' => $challenge->player1_id,
                'player2_id' => $challenge->player2_id,
            ]);
            (new ChallengeAccepted($challenge))->broadcast();

            Log::info("Avant diffusion de ChallengeStarted", [
                'challenge_id' => $challenge->id,
                'channel' => "private-challenges.{$challenge->id}",
            ]);
            (new ChallengeStarted($challenge))->broadcast();

            Log::info("Après diffusion de ChallengeStarted", [
                'challenge_id' => $challenge->id,
            ]);
        });

        return response()->json($challenge->load('player1', 'player2', 'quizzes'));
    }

    public function decline(Request $request, $challengeId)
    {
        $challenge = Challenge::findOrFail($challengeId);
        $user = auth()->user();

        if ($challenge->player2_id !== $user->id || $challenge->status !== 'pending') {
            return response()->json(['error' => 'Invalid challenge'], 403);
        }

        DB::transaction(function () use ($challenge, $user) {
            $challenge->delete();
            History::create([
                'user_id' => $user->id,
                'type' => 'challenge',
                'description' => "Défi #$challenge->id refusé",
                'value' => 0,
            ]);
            (new ChallengeDeclined($challenge))->broadcast();
        });

        return response()->json(['message' => 'Défi refusé']);
    }

    public function show($challengeId)
    {
        if (!Str::isUuid($challengeId)) {
            return response()->json(['error' => 'Invalid challenge ID format'], 400);
        }

        $challenge = Challenge::with('player1', 'player2', 'quizzes')->findOrFail($challengeId);
        return response()->json($challenge);
    }

    public function submitAnswer(Request $request, $challengeId)
    {
        $challenge = Challenge::findOrFail($challengeId);
        $user = auth()->user();

        if ($challenge->status !== 'active' || !in_array($user->id, [$challenge->player1_id, $challenge->player2_id])) {
            return response()->json(['error' => 'Défi invalide'], 403);
        }

        $data = $request->validate([
            'question_id' => 'required|integer',
            'answer_id' => 'required|integer', // -1 pour timeout
        ]);

        $shuffledQuestions = json_decode($challenge->shuffled_questions, true);
        $currentQuestion = $shuffledQuestions[$challenge->current_question_index] ?? null;

        if (!$currentQuestion || $currentQuestion['id'] !== $data['question_id']) {
            return response()->json(['error' => 'La question ne correspond pas ou a déjà été répondue'], 422);
        }

        DB::transaction(function () use ($challenge, $user, $data, $shuffledQuestions) {
            // Si la question a déjà été répondue, on ne fait rien
            if ($challenge->question_answered_by) {
                Log::info("Question déjà répondue, ignorée", [
                    'challenge_id' => $challenge->id,
                    'user_id' => $user->id,
                    'question_id' => $data['question_id'],
                ]);
                return;
            }

            // Gestion du timeout
            if ($data['answer_id'] === -1) {
                Log::info("Timeout détecté", [
                    'challenge_id' => $challenge->id,
                    'user_id' => $user->id,
                    'question_id' => $data['question_id'],
                ]);
                $challenge->question_answered_by = $user->id;
                $challenge->save();
                (new QuestionAnswered($challenge, $user->id, -1))->broadcast();
            } else {
                // Réponse normale
                $answer = Answer::find($data['answer_id']);
                if ($answer && $answer->is_correct) {
                    $scoreField = $user->id === $challenge->player1_id ? 'player1_score' : 'player2_score';
                    $challenge->$scoreField += 10;
                    $challenge->question_answered_by = $user->id;
                    $challenge->save();
                    Log::info("Réponse correcte", [
                        'challenge_id' => $challenge->id,
                        'user_id' => $user->id,
                        'score_field' => $scoreField,
                        'new_score' => $challenge->$scoreField,
                    ]);
                    (new QuestionAnswered($challenge, $user->id, $data['answer_id']))->broadcast();
                }
            }

            // Passage à la question suivante ou fin du défi
            if ($challenge->current_question_index < count($shuffledQuestions) - 1) {
                $challenge->current_question_index++;
                $challenge->question_answered_by = null;
                $challenge->save();
                Log::info("Passage à la question suivante", [
                    'challenge_id' => $challenge->id,
                    'new_index' => $challenge->current_question_index,
                ]);
                (new NextQuestion($challenge))->broadcast();
            } else {
                Log::info("Fin du défi", ['challenge_id' => $challenge->id]);
                $this->finalizeChallenge($challenge);
            }
        });

        return response()->json($challenge->load('player1', 'player2', 'quizzes'));
    }

    public function abandon(Request $request, $challengeId)
    {
        $challenge = Challenge::findOrFail($challengeId);
        $user = auth()->user();

        if ($challenge->status !== 'active' || !in_array($user->id, [$challenge->player1_id, $challenge->player2_id])) {
            return response()->json(['error' => 'Invalid action'], 403);
        }

        DB::transaction(function () use ($challenge, $user) {
            Log::info("Abandon du défi", [
                'challenge_id' => $challenge->id,
                'user_id' => $user->id,
            ]);
            $winnerId = $challenge->player1_id === $user->id ? $challenge->player2_id : $challenge->player1_id;
            $this->finalizeChallenge($challenge, $winnerId, true);
        });

        return response()->json(['message' => 'Défi abandonné']);
    }

    public function cancel(Request $request, $challengeId)
    {
        $challenge = Challenge::findOrFail($challengeId);
        $user = auth()->user();

        if ($challenge->player1_id !== $user->id || $challenge->status !== 'pending') {
            return response()->json(['error' => 'Invalid action'], 403);
        }

        DB::transaction(function () use ($challenge, $user) {
            $challenge->delete();
            History::create([
                'user_id' => $user->id,
                'type' => 'challenge',
                'description' => "Défi #$challenge->id annulé",
                'value' => 0,
            ]);
            (new ChallengeCancelled($challenge))->broadcast();
        });

        return response()->json(['message' => 'Défi annulé']);
    }

   public function lobby()
    {
        $pending = Challenge::where('player2_id', auth()->id())
            ->where('status', 'pending')
            ->with('player1', 'player2', 'quizzes')
            ->get();

        Log::info("Lobby chargé pour l'utilisateur", [
            'user_id' => auth()->id(),
            'pending_challenges' => $pending->pluck('id')->toArray(),
        ]);

        return response()->json(['pending' => $pending]);
    }

    public function activeChallenges()
    {
        $userId = auth()->id();

        $active = Challenge::where('status', 'active')
            ->where(function ($query) use ($userId) {
                $query->where('player1_id', $userId)
                    ->orWhere('player2_id', $userId);
            })
            ->with('player1', 'player2', 'quizzes.questions.answers')
            ->get();

        Log::info("Défis actifs récupérés pour l'utilisateur", [
            'user_id' => $userId,
            'active_count' => $active->count(),
            'challenge_ids' => $active->pluck('id')->toArray(),
        ]);

        return response()->json(['active' => $active]);
    }

    private function finalizeChallenge(Challenge $challenge, $winnerId = null, $abandoned = false)
    {
        $winnerId = $winnerId ?? ($challenge->player1_score > $challenge->player2_score ? $challenge->player1_id : $challenge->player2_id);
        $loserId = $winnerId === $challenge->player1_id ? $challenge->player2_id : $challenge->player1_id;
        $totalXp = $challenge->player1_bet + $challenge->player2_bet + ($winnerId === $challenge->player1_id ? $challenge->player1_score : $challenge->player2_score);

        $winner = User::findOrFail($winnerId);
        $loser = User::findOrFail($loserId);

        $winner->xp += $totalXp;
        $winner->duel_wins += 1;
        $oldLeague = $winner->league;
        $this->updateLeague($winner);
        $this->updateLeague($loser);
        $this->checkBadges($winner);

        $challenge->status = 'completed';
        $challenge->winner_id = $winnerId;
        $challenge->save();

        Log::info("Défi finalisé", [
            'challenge_id' => $challenge->id,
            'winner_id' => $winnerId,
            'loser_id' => $loserId,
            'total_xp' => $totalXp,
            'abandoned' => $abandoned,
        ]);

        History::create([
            'user_id' => $winner->id,
            'type' => 'challenge',
            'description' => $abandoned ? "Défi #$challenge->id gagné par abandon" : "Défi #$challenge->id gagné",
            'value' => $totalXp,
        ]);
        History::create([
            'user_id' => $loser->id,
            'type' => 'challenge',
            'description' => $abandoned ? "Défi #$challenge->id abandonné" : "Défi #$challenge->id perdu",
            'value' => 0,
        ]);

        if ($oldLeague !== $winner->league) {
            Post::create([
                'user_id' => $winner->id,
                'content' => "J’ai atteint la ligue {$winner->league} !",
                'type' => 'league',
            ]);
        }

        $winner->save();
        $loser->save();

        ($abandoned ? new ChallengeAbandoned($challenge) : new ChallengeCompleted($challenge))->broadcast();
    }

    private function updateLeague(User $user)
    {
        $leagues = config('leagues');
        foreach ($leagues as $league => $range) {
            if ($user->xp >= $range['min_xp'] && ($range['max_xp'] === null || $user->xp <= $range['max_xp'])) {
                $user->league = $league;
                break;
            }
        }
    }

    private function checkBadges(User $user)
    {
        $badges = [
            ['name' => 'Serial Winner', 'condition' => $user->duel_wins >= 5, 'description' => '5 duels gagnés'],
            ['name' => 'Legend', 'condition' => $user->xp >= 9001, 'description' => '9001 XP atteints'],
        ];

        foreach ($badges as $badgeData) {
            if ($badgeData['condition'] && !$user->badges()->where('name', $badgeData['name'])->exists()) {
                $badge = Badge::firstOrCreate(['name' => $badgeData['name']], ['description' => $badgeData['description']]);
                $user->badges()->attach($badge->id, ['earned_at' => now()]);
                History::create([
                    'user_id' => $user->id,
                    'type' => 'badge',
                    'description' => "Badge {$badge->name} obtenu",
                ]);
                Post::create([
                    'user_id' => $user->id,
                    'content' => "J’ai obtenu le badge {$badge->name} !",
                    'type' => 'badge',
                    'related_id' => $badge->id,
                ]);
            }
        }
    }
}