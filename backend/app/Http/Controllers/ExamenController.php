<?php

namespace App\Http\Controllers;

use App\Models\Examen;
use App\Models\UserReponseQcm;
use App\Models\HistoriqueQcm;
use App\Events\ExamenPublished;
use App\Models\QuestionQcm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ExamenController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $publishedExamens = Examen::with('qcms')
            ->where('status', 'PUBLISHED')
            ->get();

        // Filtrer les examens déjà passés par l'utilisateur
        $userResponses = UserReponseQcm::where('user_id', $user->id)
            ->pluck('examen_id')
            ->toArray();

        if ($user->isAdmin()) {
            return Examen::with('qcms')->get();
        }

        return $publishedExamens->filter(function ($examen) use ($userResponses) {
            return !in_array($examen->id, $userResponses);
        });
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'timer' => 'required|integer|min:60',
            'qcm_ids' => 'required|array|min:1',
            'qcm_ids.*' => 'exists:qcms,id',
        ]);

        $examen = Examen::create([
            'title' => $request->title,
            'user_id' => auth()->id(),
            'timer' => $request->timer,
        ]);
        $examen->qcms()->sync($request->qcm_ids);
        event(new ExamenPublished($examen));

        return response()->json($examen->load('qcms'), 201);
    }

    public function show($id)
    {
        $examen = Examen::with([
            'qcms.categoryQcm',
            'qcms.questions.answers',
            'user'
        ])->findOrFail($id);

        // Vérifier si l'utilisateur a déjà passé cet examen
        $userResponse = UserReponseQcm::where('user_id', auth()->id())
            ->where('examen_id', $id)
            ->exists();

        if ($userResponse && !auth()->user()->isAdmin()) {
            abort(403, 'Vous avez déjà passé cet examen.');
        }

        return response()->json($examen);
    }

    public function update(Request $request, $id)
    {
        $examen = Examen::findOrFail($id);
        $request->validate([
            'title' => 'required|string|max:255',
            'timer' => 'required|integer|min:60',
            'qcm_ids' => 'required|array|min:1',
            'qcm_ids.*' => 'exists:qcms,id',
        ]);

        $examen->update($request->only('title', 'timer'));
        $examen->qcms()->sync($request->qcm_ids);
        event(new ExamenPublished($examen));
        return response()->json($examen->load('qcms'));
    }

    public function destroy($id)
    {
        $examen = Examen::findOrFail($id);
        $examen->delete();
        event(new ExamenPublished($examen));
        return response()->json(null, 204);
    }

    public function publish($id)
    {
        $examen = Examen::findOrFail($id);
        $examen->update(['status' => 'PUBLISHED']);
        HistoriqueQcm::create([
            'user_id' => auth()->id(),
            'type' => 'EXAMEN_PUBLISHED',
            'description' => "Examen {$examen->title} publié",
        ]);
        event(new ExamenPublished($examen));
        return response()->json($examen);
    }

    public function submit(Request $request, $id)
    {
        $examen = Examen::with('qcms.questions.answers')->findOrFail($id);
        if ($examen->status !== 'PUBLISHED') {
            abort(403, 'Examen non disponible');
        }

        // Vérifier si l'utilisateur a déjà soumis une réponse
        $existingResponse = UserReponseQcm::where('user_id', auth()->id())
            ->where('examen_id', $id)
            ->exists();
        if ($existingResponse) {
            abort(403, 'Vous avez déjà soumis cet examen.');
        }

        $request->validate([
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|exists:question_qcms,id',
            'answers.*.answer_ids' => 'present|array', // Remplace "required" par "present"
        ]);

        $score = $this->calculateScore($examen, $request->answers);
        $result = UserReponseQcm::create([
            'user_id' => auth()->id(),
            'examen_id' => $id,
            'answers' => $request->answers,
            'score' => $score,
            'submitted_at' => now(),
        ]);

        HistoriqueQcm::create([
            'user_id' => auth()->id(),
            'type' => 'EXAMEN_SUBMITTED',
            'description' => "Examen {$examen->title} soumis avec une note de $score/20",
        ]);

        return response()->json($result);
    }

    public function results($id)
    {
        try {
            if (!preg_match('/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/', $id)) {
                return response()->json(['error' => 'ID invalide, un UUID est requis'], 400);
            }

            Log::info("ID reçu pour results: " . $id);
            $examen = Examen::findOrFail($id);
            $results = UserReponseQcm::where('examen_id', $id)->with('user')->get();
            return response()->json($results);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Examen non trouvé'], 404);
        } catch (\Exception $e) {
            Log::error("Erreur dans results: " . $e->getMessage());
            return response()->json(['error' => 'Erreur interne du serveur'], 500);
        }
    }

    public function allResults()
    {
        $results = UserReponseQcm::with(['user', 'examen.qcms.categoryQcm','examen.qcms.questions.answers'])->get();
        return response()->json($results);
    }

    private function calculateScore($examen, $userAnswers)
    {
        $totalQuestions = $examen->qcms->flatMap->questions->count();
        $correctAnswers = 0;

        foreach ($userAnswers as $answer) {
            $question = QuestionQcm::find($answer['question_id']);
            $correctIds = $question->answers->where('is_correct', true)->pluck('id')->toArray();
            $userIds = $answer['answer_ids'];

            if (count(array_diff($correctIds, $userIds)) === 0 && count(array_diff($userIds, $correctIds)) === 0) {
                $correctAnswers++;
            }
        }

        return ($correctAnswers / $totalQuestions) * 20;
    }
}