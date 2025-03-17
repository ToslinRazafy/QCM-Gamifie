<?php

// App/Http/Controllers/FriendController.php
namespace App\Http\Controllers;

use App\Events\FriendRequestSent;
use App\Events\FriendRequestResponded;
use App\Models\Friend;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class FriendController extends Controller
{
   public function request(Request $request)
    {
        $friendId = $request->validate([
            'friend_id' => 'required|exists:users,id|not_in:' . auth()->id()
        ])['friend_id'];

        return DB::transaction(function () use ($friendId) {
            $friendship = Friend::firstOrCreate(
                ['user_id' => auth()->id(), 'friend_id' => $friendId],
                ['status' => 'pending']
            );

            if ($friendship->wasRecentlyCreated) {
                $friendship->load('user', 'friend');
                (new FriendRequestSent($friendship))->broadcast();
                return response()->json($friendship, 201);
            }

            return response()->json(['error' => 'Demande déjà existante'], 400);
        });
    }

    public function accept($friendId)
    {
        Log::info("Tentative d'acceptation", [
            'friendId' => $friendId,
            'auth_id' => auth()->id(),
        ]);
        $friendship = Friend::where('friend_id', auth()->id())
            ->where('user_id', $friendId)
            ->where('status', 'pending')
            ->firstOrFail();


        if (!$friendship) {
            Log::warning("Aucune demande trouvée", [
                'friendId' => $friendId,
                'auth_id' => auth()->id(),
            ]);
            return response()->json(['error' => 'Demande non trouvée'], 404);
        }

        $friendship->update(['status' => 'accepted']);
        $friendship->load('user', 'friend');
        (new FriendRequestResponded($friendship, 'accepted'))->broadcast();

        return response()->json($friendship);
    }

    public function reject($friendId)
    {
        Log::info("Tentative de rejet", [
            'friendId' => $friendId,
            'auth_id' => auth()->id(),
        ]);
        $friendship = Friend::where('friend_id', auth()->id())
            ->where('user_id', $friendId)
            ->where('status', 'pending')
            ->firstOrFail();

        $friendship->load('user', 'friend');
        $friendship->delete();
        (new FriendRequestResponded($friendship, 'rejected'))->broadcast();

        return response()->json(['message' => 'Demande rejetée', 'friendship' => $friendship]);
    }

    public function cancel($friendId)
    {
        $friendship = Friend::where('user_id', auth()->id())
            ->where('friend_id', $friendId)
            ->where('status', 'pending')
            ->firstOrFail();

        $friendship->load('user', 'friend');
        $friendship->delete();
        (new FriendRequestResponded($friendship, 'cancelled'))->broadcast();

        return response()->json(['message' => 'Demande annulée', 'friendship' => $friendship]);
    }

    public function remove($friendId)
    {
        $friendship = Friend::where('status', 'accepted')
            ->where(function ($query) use ($friendId) {
                $query->where('user_id', auth()->id())
                      ->where('friend_id', $friendId)
                      ->orWhere('user_id', $friendId)
                      ->where('friend_id', auth()->id());
            })
            ->firstOrFail();

        $friendship->load('user', 'friend');
        $friendship->delete();
        (new FriendRequestResponded($friendship, 'removed'))->broadcast();

        return response()->json(['message' => 'Ami retiré', 'friendship' => $friendship]);
    }

    public function index()
    {
        try {
            $friendships = Friend::where(function ($query) {
                $query->where('user_id', auth()->id())
                      ->orWhere('friend_id', auth()->id());
            })
            ->with([
                'user' => fn($query) => $query->select('id', 'pseudo', 'avatar', 'firstname', 'lastname', 'status'),
                'friend' => fn($query) => $query->select('id', 'pseudo', 'avatar', 'firstname', 'lastname', 'status')
            ])
            ->get();

            return response()->json($friendships->map(fn($f) => [
                'id' => $f->id,
                'user_id' => $f->user_id,
                'friend_id' => $f->friend_id,
                'status' => $f->status,
                'user' => $f->user->toArray(),
                'friend' => $f->friend->toArray(),
            ]));
        } catch (\Exception $e) {
            Log::error("Erreur dans FriendController::index", [
                'user_id' => auth()->id(),
                'message' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }
}