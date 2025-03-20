<?php 

namespace App\Http\Controllers;

use App\Models\CategoryQCM;
use Illuminate\Http\Request;

class CategoryQcmController extends Controller
{
    public function index()
    {
        return CategoryQCM::with('user')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:category_q_c_m_s,name',
            'description' => 'nullable|string',
        ]);

        $category = CategoryQCM::create([
            'name' => $request->name,
            'user_id' => auth()->id(),
            'description' => $request->description,
        ]);

        return response()->json($category, 201);
    }

    public function show($id)
    {
        return CategoryQCM::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $category = CategoryQCM::findOrFail($id);
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $category->update($request->only('name', 'description'));
        return response()->json($category);
    }

    public function destroy($id)
    {
        $category = CategoryQCM::findOrFail($id);
        $category->delete();
        return response()->json(null, 204);
    }
}