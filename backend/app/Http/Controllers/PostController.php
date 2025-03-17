<?php

namespace App\Http\Controllers;

use App\Events\PostCreated;
use App\Events\PostLiked;
use App\Events\PostUnliked; // Nouveau
use App\Events\PostCommented;
use App\Events\CommentUpdated; // Nouveau
use App\Events\CommentDeleted; // Nouveau
use App\Models\Post;
use App\Models\Like;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PostController extends Controller
{
    public function index()
    {
        $posts = Post::with('user.friends', 'likes', 'comments.user')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($posts);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'content' => 'required|string|max:500',
            'type' => 'required|in:challenge,badge,league',
        ]);

        $post = DB::transaction(function () use ($data) {
            $post = Post::create([...$data, 'user_id' => auth()->id()]);
            (new PostCreated($post))->broadcast();
            return $post;
        });

        $post->load('user', 'likes', 'comments.user');
        return response()->json($post, 201);
    }

    public function like($postId)
    {
        $existingLike = Like::where('user_id', auth()->id())->where('post_id', $postId)->first();
        if ($existingLike) {
            return response()->json(['error' => 'Post already liked'], 400);
        }

        $like = DB::transaction(function () use ($postId) {
            $like = Like::create(['user_id' => auth()->id(), 'post_id' => $postId]);
            (new PostLiked($like))->broadcast();
            return $like;
        });

        return response()->json($like, 201);
    }

    public function unlike($postId)
    {
        $like = Like::where('user_id', auth()->id())->where('post_id', $postId)->first();
        if (!$like) {
            return response()->json(['error' => 'Post not liked'], 400);
        }

        DB::transaction(function () use ($like) {
            $like->delete();
            (new PostUnliked($like))->broadcast();
        });

        return response()->json(['message' => 'Like removed'], 200);
    }

    public function comment(Request $request, $postId)
    {
        $data = $request->validate([
            'content' => 'required|string|max:255',
        ]);

        $comment = DB::transaction(function () use ($postId, $data) {
            $comment = Comment::create([
                'user_id' => auth()->id(),
                'post_id' => $postId,
                'content' => $data['content'],
            ]);
            (new PostCommented($comment))->broadcast();
            return $comment;
        });

        $comment->load('user');
        return response()->json($comment, 201);
    }

    public function updateComment(Request $request, $postId, $commentId)
    {
        $comment = Comment::where('id', $commentId)->where('post_id', $postId)->where('user_id', auth()->id())->first();
        if (!$comment) {
            return response()->json(['error' => 'Comment not found or not authorized'], 404);
        }

        $data = $request->validate([
            'content' => 'required|string|max:255',
        ]);

        DB::transaction(function () use ($comment, $data) {
            $comment->update(['content' => $data['content']]);
            (new CommentUpdated($comment))->broadcast();
        });

        $comment->load('user');
        return response()->json($comment, 200);
    }

    public function deleteComment($postId, $commentId)
    {
        $comment = Comment::where('id', $commentId)->where('post_id', $postId)->where('user_id', auth()->id())->first();
        if (!$comment) {
            return response()->json(['error' => 'Comment not found or not authorized'], 404);
        }

        DB::transaction(function () use ($comment) {
            $comment->delete();
            (new CommentDeleted($comment))->broadcast();
        });

        return response()->json(['message' => 'Comment deleted'], 200);
    }
}