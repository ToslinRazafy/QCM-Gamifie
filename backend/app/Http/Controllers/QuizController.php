<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\Question;
use App\Models\Answer;
use App\Models\Badge;
use App\Models\UserResponse;
use App\Models\History;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizController extends Controller
{
    public function index()
    {
        $userId = auth()->id();

        return Quiz::with('category', 'questions.answers')
            ->whereDoesntHave('questions.userResponses', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            }) 
            ->get();
    }

    public function store11(Request $request)
    {
        $data = $request->validate([
            'quizzes' => 'required|array|min:1',
            'quizzes.*.title' => 'required|string|max:255',
            'quizzes.*.category_id' => 'required|exists:categories,id',
            'quizzes.*.description' => 'nullable|string',
            'quizzes.*.niveau' => 'required|in:Facile,Moyen,Difficile',
            'quizzes.*.questions' => 'required|array|min:3|max:6',
            'quizzes.*.questions.*.text' => 'required|string',
            'quizzes.*.questions.*.time_limit' => 'nullable|integer|min:10',
            'quizzes.*.questions.*.answers' => 'required|array|min:3|max:6',
            'quizzes.*.questions.*.answers.*.text' => 'required|string',
            'quizzes.*.questions.*.answers.*.is_correct' => 'required|boolean',
        ]);

        // Validate that each question has exactly one correct answer
        foreach ($data['quizzes'] as $quizData) {
            foreach ($quizData['questions'] as $qData) {
                $correctCount = count(array_filter($qData['answers'], fn($a) => $a['is_correct']));
                if ($correctCount !== 1) {
                    return response()->json(['error' => 'Each question must have exactly one correct answer'], 422);
                }
            }
        }

        $createdQuizzes = DB::transaction(function () use ($data) {
            $quizzes = [];
            
            foreach ($data['quizzes'] as $quizData) {
                $quiz = Quiz::create([
                    'title' => $quizData['title'],
                                   'user_id' => '189b0f65-eecd-4570-aadc-697038814ce0',

                    'category_id' => $quizData['category_id'],
                    'description' => $quizData['description'],
                    'niveau' => $quizData['niveau'],
                ]);

                foreach ($quizData['questions'] as $qData) {
                    $question = Question::create([
                        'quiz_id' => $quiz->id,
                        'text' => $qData['text'],
                        'time_limit' => $qData['time_limit'] ?? null,
                    ]);

                    foreach ($qData['answers'] as $aData) {
                        Answer::create([
                            'question_id' => $question->id,
                            'text' => $aData['text'],
                            'is_correct' => $aData['is_correct'],
                        ]);
                    }
                }

                $quizzes[] = $quiz;
            }

            return $quizzes;
        });

        // Load relationships for all created quizzes
        $createdQuizzes = collect($createdQuizzes)->map(function ($quiz) {
            return $quiz->load('category', 'questions.answers');
        });

        return response()->json($createdQuizzes, 201);
    }


    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable|string',
            'niveau' => 'required|in:Facile,Moyen,Difficile',
            'questions' => 'required|array|min:3|max:6',
            'questions.*.text' => 'required|string',
            'questions.*.time_limit' => 'nullable|integer|min:10',
            'questions.*.answers' => 'required|array|min:3|max:6',
            'questions.*.answers.*.text' => 'required|string',
            'questions.*.answers.*.is_correct' => 'required|boolean',
        ]);

        foreach ($data['questions'] as $qData) {
            $correctCount = count(array_filter($qData['answers'], fn($a) => $a['is_correct']));
            if ($correctCount !== 1) {
                return response()->json(['error' => 'Each question must have exactly one correct answer'], 422);
            }
        }

        $quiz = DB::transaction(function () use ($data) {
            $quiz = Quiz::create([
                'title' => $data['title'],
                'user_id' => auth()->id(),
                'category_id' => $data['category_id'],
                'description' => $data['description'],
                'niveau' => $data['niveau'],
            ]);

            foreach ($data['questions'] as $qData) {
                $question = Question::create([
                    'quiz_id' => $quiz->id,
                    'text' => $qData['text'],
                    'time_limit' => $qData['time_limit'] ?? null,
                ]);

                foreach ($qData['answers'] as $aData) {
                    Answer::create([
                        'question_id' => $question->id,
                        'text' => $aData['text'],
                        'is_correct' => $aData['is_correct'],
                    ]);
                }
            }

            return $quiz;
        });

        $quiz->load('category', 'questions.answers');
        return response()->json($quiz, 201);
    }

    public function show($id)
    {
        $quiz = Quiz::with('category', 'questions.answers')->findOrFail($id);
        return response()->json($quiz);
    }

    public function update(Request $request, $id)
    {
        $quiz = Quiz::findOrFail($id);

        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'category_id' => 'sometimes|required|exists:categories,id',
            'description' => 'nullable|string',
            'questions' => 'sometimes|required|array|min:3|max:6',
            'questions.*.text' => 'required|string',
            'questions.*.time_limit' => 'nullable|integer|min:10',
            'questions.*.answers' => 'required|array|min:3|max:6',
            'questions.*.answers.*.text' => 'required|string',
            'questions.*.answers.*.is_correct' => 'required|boolean',
        ]);

        DB::transaction(function () use ($quiz, $data, $request) {
            $quiz->update($request->only('title', 'category_id', 'description'));

          if ($request->has('questions')) {
                // Supprimer les anciennes questions et réponses
                $quiz->questions()->each(function ($question) {
                    $question->answers()->delete();
                    $question->delete();
                });

                // Créer les nouvelles questions et réponses
                foreach ($data['questions'] as $qData) {
                    $question = Question::create([
                        'quiz_id' => $quiz->id,
                        'text' => $qData['text'],
                        'time_limit' => $qData['time_limit'] ?? null,
                    ]);
                    foreach ($qData['answers'] as $aData) {
                        Answer::create([
                            'question_id' => $question->id,
                            'text' => $aData['text'],
                            'is_correct' => $aData['is_correct'],
                        ]);
                    }
                }
            }
        });

        $quiz->load('category', 'questions.answers');
        return response()->json($quiz);
    }

    public function destroy($id)
    {
       $quiz = Quiz::findOrFail($id);
        DB::transaction(function () use ($quiz) {
            $quiz->questions()->each(function ($question) {
                $question->answers()->delete();
                $question->delete();
            });
            $quiz->delete();
        });
        return response()->json(['message' => 'Quiz deleted'], 200);
    }

    public function submit(Request $request, $quizId)
    {
        $data = $request->validate([
            'responses' => 'required|array',
            'responses.*.question_id' => 'required|exists:questions,id',
            'responses.*.answer_id' => 'required|exists:answers,id',
        ]);

        $user = auth()->user();

        $score = DB::transaction(function () use ($data, $user, $quizId) {
            $score = 0;

            foreach ($data['responses'] as $response) {
                $answer = Answer::with('question.quiz')->findOrFail($response['answer_id']);
                if ($answer->is_correct) {
                    if($answer->question->quiz->niveau === "Facile"){
                        $score += 10;
                    }elseif($answer->question->quiz->niveau === "Moyen"){
                        $score += 20;
                    }else{
                        $score += 30;
                    }
                }

                UserResponse::create([
                    'user_id' => $user->id,
                    'question_id' => $response['question_id'],
                    'answer_id' => $response['answer_id'],
                ]);
            }

            $user->xp += $score;
            $oldLeague = $user->league;
            $this->updateLeague($user);
            $this->checkBadges($user);
            $user->save();

            History::create([
                'user_id' => $user->id,
                'type' => 'xp',
                'description' => "Earned $score XP from quiz",
                'value' => $score,
            ]);
            History::create([
                'user_id' => $user->id,
                'type' => 'quiz',
                'description' => "Quiz #$quizId completed",
            ]);

            if ($oldLeague !== $user->league) {
                History::create([
                    'user_id' => $user->id,
                    'type' => 'league',
                    'description' => "Promoted to $user->league",
                ]);
                Post::create([
                    'user_id' => $user->id,
                    'content' => "I’ve reached $user->league!",
                    'type' => 'league',
                ]);
            }

            return $score;
        });

        return response()->json(['score' => $score, 'xp' => $user->xp]);
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

    private function checkBadges(User $user)
    {
        $badges = [
            ['name' => 'Serial Winner', 'condition' => $user->duel_wins >= 5, 'description' => 'Won 5 duels'],
            ['name' => 'Legend', 'condition' => $user->xp >= 9001, 'description' => 'Reached 9001 XP'],
        ];

        foreach ($badges as $badgeData) {
            if ($badgeData['condition'] && !$user->badges()->where('name', $badgeData['name'])->exists()) {
                $badge = Badge::firstOrCreate(
                    ['name' => $badgeData['name']],
                    ['description' => $badgeData['description']]
                );
                $user->badges()->attach($badge->id, ['earned_at' => now()]);
                History::create([
                    'user_id' => $user->id,
                    'type' => 'badge',
                    'description' => "Badge {$badge->name} earned",
                ]);
                Post::create([
                    'user_id' => $user->id,
                    'content' => "I earned the {$badge->name} badge!",
                    'type' => 'badge',
                    'related_id' => $badge->id,
                ]);
            }
        }
    }
}