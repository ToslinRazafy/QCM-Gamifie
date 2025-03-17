<?php

namespace App\Http\Controllers;

use App\Events\UserStatusChanged;
use App\Models\User;
use App\Models\History;
use App\Models\Quiz;
use App\Models\Challenge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class UserController extends Controller
{
    public function index()
    {
        return User::all()->load([
            'quizzes',
            'userResponses',
            'challengesAsPlayer1',
            'challengesAsPlayer2',
            'wonChallenges',
            'badges',
            'history',
            'friends',
            'friendOf',
            'posts',
            'likes',
            'comments'
        ]);
    }

    public function show(Request $request, $userId)
    {
        try {
            $user = User::with([
                'quizzes',
                'userResponses',
                'challengesAsPlayer1',
                'challengesAsPlayer2',
                'wonChallenges',
                'badges',
                'history',
                'friends' => function ($query) {
                    $query->with('friend'); 
                },
                'friendOf' => function ($query) {
                    $query->with('user'); 
                },
                'posts' => function ($query) {
                    $query->with('likes', 'comments'); 
                },
                'likes',
                'comments'
            ])->findOrFail($userId);

            return response()->json($user);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Utilisateur non trouvé'], 404);
        }
    }

    public function leaderboard()
    {
        $users = User::orderBy('xp', 'desc')->take(10)->get();
        return response()->json($users);
    }

    public function updateProfile(Request $request)
    {
        $user = auth()->user();

        Log::info("donne :", ['user' => $request->all()]);

        $validator = Validator::make($request->all(), [
            'firstname' => 'required|string|max:255',
            'lastname' => 'nullable|string|max:255',
            'pseudo' => 'required|string|max:255|unique:users,pseudo,' . $user->id,
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:6000',
            'bio' => 'nullable|string|max:500',
            'country' => 'nullable|string|max:100',
        ]);

        // Si la validation échoue, retourner les erreurs
        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first() . ' (and ' . ($validator->errors()->count() - 1) . ' more errors)',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Préparer les données validées
        $validated = $validator->validated();

        // Gestion de l'avatar
        if ($request->hasFile('avatar')) {
            // Supprimer l'ancien avatar s'il existe
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
                Log::info("Ancien avatar supprimé:", ['path' => $user->avatar]);
            }

            // Stocker le nouvel avatar
            $path = $request->file('avatar')->store('upload/profil', 'public');
            $validated['avatar'] = $path;
            Log::info("Nouvel avatar uploadé:", ['path' => $path]);
        } else {
            // Conserver l'avatar existant si aucun nouveau fichier n'est fourni
            $validated['avatar'] = $user->avatar;
            Log::info("Avatar conservé:", ['path' => $user->avatar]);
        }

        // Mettre à jour l'utilisateur
        $user->update($validated);

        // Retourner une réponse JSON avec les données mises à jour
        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'user' => $user,
        ], 200);
    }
    
     public function updatePassword(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['message' => 'Mot de passe actuel incorrect'], 401);
        }

        $user->update(['password' => Hash::make($validated['new_password'])]);
        return response()->json(['message' => 'Mot de passe mis à jour']);
    }

    public function deleteProfile()
    {
        $user = auth()->user();
        $user->delete();
        JWTAuth::invalidate(JWTAuth::getToken());
        return response()->json(['message' => 'Account deleted']);
    }

    public function dashboard()
    {
        $totalUsers = User::count();
        $activeUsers = User::where('status', 'online')->count();
        $quizzes = Quiz::count();
        $challenges = Challenge::count();

        return response()->json([
            'total_users' => $totalUsers,
            'active_users' => $activeUsers,
            'total_quizzes' => $quizzes,
            'total_challenges' => $challenges,
        ]);
    }

    public function toggleUserActive($id)
    {
        $user = User::findOrFail($id);
        if ($user->role === 'ADMIN') {
            return response()->json(['error' => 'Cannot modify an admin'], 403);
        }
        $user->update(['is_active' => !$user->is_active]);
        return response()->json($user);
    }

    public function toggleProfileActive(Request $request)
    {
        $user = auth()->user();
        $user->update(['is_active' => !$user->is_active]);
        return response()->json($user);
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        if ($user->role === 'ADMIN') {
            return response()->json(['error' => 'Cannot delete an admin'], 403);
        }
        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }

    public function updateStatus(Request $request)
    {
        $validated = $request->validate([
            'userId' => 'required|string|exists:users,id',
            'status' => 'required|in:online,offline',
        ]);

        $user = User::findOrFail($validated['userId']);
        $user->setStatus($validated['status']);

        return response()->json(['message' => 'Statut mis à jour', 'user' => $user]);
    }
}