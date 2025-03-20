<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    public function index()
    {
        return Category::with('user')->get();
    }

    public function store11(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'categories' => 'required|array',
            'categories.*.name' => 'required|string|max:255|unique:categories,name',
            'categories.*.description' => 'required|string' // Validation de la description
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $createdCategories = [];
        // $userId = auth()->id();

        // Traiter chaque catégorie reçue
        foreach ($request->categories as $categoryData) {
            $category = Category::create([
                'name' => $categoryData['name'],
                'user_id' => '189b0f65-eecd-4570-aadc-697038814ce0',
                'description' => $categoryData['description']
            ]);

            $createdCategories[] = $category;
        }

        return response()->json($createdCategories, 201);
    }


    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:categories',
            'description' => 'required|string',
            'image' => 'nullable|image|max:6000', // Max 6MB
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $imagePath = $request->hasFile('image') ? $request->file('image')->store('category_images', 'public') : null;

        $category = Category::create([
            'name' => $request->name,
            'user_id' => auth()->id(),
            'description' => $request->description,
            'image' => $imagePath,
        ]);

        return response()->json($category, 201);
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255|unique:categories,name,' . $id,
            'description' => 'sometimes|required|string',
            'image' => 'nullable|image|max:6000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $imagePath = $category->image; 
        if ($request->hasFile('image')) {
            if ($category->image && Storage::disk('public')->exists($category->image)) {
                Storage::disk('public')->delete($category->image);
            }
            $imagePath = $request->file('image')->store('category_images', 'public');
        }

        $category->update([
            'name' => $request->name ?? $category->name,
            'description' => $request->description ?? $category->description,
            'image' => $imagePath,
        ]);

        return response()->json($category);
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);

        if ($category->image && Storage::disk('public')->exists($category->image)) {
            Storage::disk('public')->delete($category->image);
        }

        $category->delete();
        return response()->json(['message' => 'Category deleted'], 200);
    }
}