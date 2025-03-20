<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\ChallengeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FriendController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CategoryQcmController;
use App\Http\Controllers\ExamenController;
use App\Http\Controllers\HistoriqueQcmController;
use App\Http\Controllers\QcmController;
use Illuminate\Support\Facades\Log;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::get('/auth/facebook', [AuthController::class, 'redirectToFacebook']);
Route::get('/auth/facebook/callback', [AuthController::class, 'handleFacebookCallback']);
Route::get('/auth/google', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);
Route::post('/update-status', [UserController::class, 'updateStatus']);
Route::post('/cate', [CategoryController::class, 'store11']);
Route::post('/quize', [QuizController::class, 'store11']);

Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('role:ADMIN')->group(function () {
        Route::get('/dashboard', [UserController::class, 'dashboard']);
        Route::apiResource('quizzes', QuizController::class)->except('index', 'show');
        Route::apiResource('categories', CategoryController::class)->except('index');
        Route::delete('/users/{id}', [UserController::class, 'deleteUser']);
        Route::patch('/users/{id}/toggle-active', [UserController::class, 'toggleUserActive']);
        Route::apiResource('category-qcms', CategoryQcmController::class);
        Route::apiResource('qcms', QcmController::class);
        Route::apiResource('examens', ExamenController::class)->except("show");
        Route::post('examens/{id}/publish', [ExamenController::class, 'publish']);
    });
    
    Route::apiResource('users', UserController::class)->only('index', 'show');
    Route::post('/profile', [UserController::class, 'updateProfile']);
    Route::patch('/profile/password', [UserController::class, 'updatePassword']);
    Route::patch('/profile/toggle-active', [UserController::class, 'toggleProfileActive']);
    Route::delete('/profile', [UserController::class, 'deleteProfile']);
    Route::get('/leaderboard', [UserController::class, 'leaderboard']);
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/quizzes', [QuizController::class, 'index']);
    Route::get('/quizzes/{id}', [QuizController::class, 'show']);
    Route::get('examens', [ExamenController::class, 'index']);
    Route::get('/examens/results', [ExamenController::class, 'allResults']); // Tous les résultats
    Route::post('examens/{id}/submit', [ExamenController::class, 'submit']);
    Route::get('examens/{id}', [ExamenController::class, 'show']);
    Route::get('/examens/{id}/results', [ExamenController::class, 'results']); // Résultats d’un examen spécifique
    Route::get('historique-qcm', [HistoriqueQcmController::class, 'index']);

    Route::middleware('role:USER')->group(function () {
        Route::post('/quizzes/{quizId}/submit', [QuizController::class, 'submit']);
        Route::post('/challenges/invite', [ChallengeController::class, 'invite']);
        Route::post('/challenges/accept/{challengeId}', [ChallengeController::class, 'accept']);
        Route::post('/challenges/decline/{challengeId}', [ChallengeController::class, 'decline']);
        Route::get('/challenges/active', [ChallengeController::class, 'activeChallenges']);
        Route::get('/challenges/{challengeId}', [ChallengeController::class, 'show']);
        Route::post('/challenges/submit/{challengeId}', [ChallengeController::class, 'submitAnswer']);
        Route::post('/challenges/abandon/{challengeId}', [ChallengeController::class, 'abandon']);
        Route::post('/challenges/cancel/{challengeId}', [ChallengeController::class, 'cancel']);
        Route::get('/lobby', [ChallengeController::class, 'lobby']);
        Route::apiResource('friends', FriendController::class)->only('index');
        Route::post('/friends/request', [FriendController::class, 'request']);
        Route::post('/friends/accept/{friend_id}', [FriendController::class, 'accept']);
        Route::post('/friends/reject/{friend_id}', [FriendController::class, 'reject']);
        Route::post('/friends/cancel/{friend_id}', [FriendController::class, 'cancel']);
        Route::post('/friends/remove/{friend_id}', [FriendController::class, 'remove']);
        Route::apiResource('posts', PostController::class)->only('index', 'store');
        Route::post('/posts/{post_id}/like', [PostController::class, 'like']);
        Route::delete('/posts/{post_id}/unlike', [PostController::class, 'unlike']); // Nouvelle route pour supprimer un like
        Route::post('/posts/{post_id}/comment', [PostController::class, 'comment']);
        Route::put('/posts/{post_id}/comment/{comment_id}', [PostController::class, 'updateComment']); // Nouvelle route pour modifier un commentaire
        Route::delete('/posts/{post_id}/comment/{comment_id}', [PostController::class, 'deleteComment']); // Nouvelle route pour supprimer un commentaire;
    });
});