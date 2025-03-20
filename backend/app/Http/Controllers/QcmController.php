<?php 

namespace App\Http\Controllers;

use App\Models\Qcm;
use Illuminate\Http\Request;

class QcmController extends Controller
{
    public function index()
    {
        return Qcm::with('categoryQcm', 'questions.answers')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'category_qcm_id' => 'required|exists:category_q_c_m_s,id',
            'description' => 'nullable|string',
            'questions' => 'required|array|min:5|max:12',
            'questions.*.text' => 'required|string',
            'questions.*.type' => 'required|in:MULTIPLE_CHOICE,TRUE_FALSE',
            'questions.*.answers' => 'required|array|min:2|max:6',
            'questions.*.answers.*.text' => 'required|string',
            'questions.*.answers.*.is_correct' => 'required|boolean',
        ]);

        $qcm = Qcm::create($request->only('title', 'category_qcm_id', 'description'));
        foreach ($request->questions as $questionData) {
            $question = $qcm->questions()->create([
                'text' => $questionData['text'],
                'type' => $questionData['type'],
            ]);
            $question->answers()->createMany($questionData['answers']);
        }

        return response()->json($qcm->load('questions.answers'), 201);
    }

    public function show($id)
    {
        return Qcm::with('categoryQcm', 'questions.answers')->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $qcm = Qcm::findOrFail($id);
        $request->validate([
            'title' => 'required|string|max:255',
            'category_qcm_id' => 'required|exists:category_q_c_m_s,id',
            'description' => 'nullable|string',
            'questions' => 'required|array|min:2|max:10',
            'questions.*.text' => 'required|string',
            'questions.*.type' => 'required|in:MULTIPLE_CHOICE,TRUE_FALSE',
            'questions.*.answers' => 'required|array|min:3|max:6',
            'questions.*.answers.*.text' => 'required|string',
            'questions.*.answers.*.is_correct' => 'required|boolean',
        ]);

        $qcm->update($request->only('title', 'category_qcm_id', 'description'));
        $qcm->questions()->delete();
        foreach ($request->questions as $questionData) {
            $question = $qcm->questions()->create([
                'text' => $questionData['text'],
                'type' => $questionData['type'],
            ]);
            $question->answers()->createMany($questionData['answers']);
        }

        return response()->json($qcm->load('questions.answers'));
    }

    public function destroy($id)
    {
        $qcm = Qcm::findOrFail($id);
        $qcm->delete();
        return response()->json(null, 204);
    }
}