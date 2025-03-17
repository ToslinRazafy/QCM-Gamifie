<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tymon\JWTAuth\Facades\JWTAuth;
use Laravel\Socialite\Facades\Socialite;
use App\Events\UserStatusChanged;
use App\Http\Services\EmailService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        VerificationCode::where('email', $request->email)->delete();

        $validator = Validator::make($request->all(), [
            'firstname' => 'required|string|max:255',
            'pseudo' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'lastname' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::transaction(function () use ($request) {
            VerificationCode::where('email', $request->email)->delete();

            $verificationCode = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

            $subject = "Vérification de l'email";
            $content = "<div style='font-family: Arial, sans-serif; padding: 20px;'>
                <h2>Vérification de compte</h2>
                <p>Merci pour votre inscription. Voici votre code de vérification :</p>
                <h3 style='background: #f4f4f4; padding: 10px; display: inline-block; border-radius: 5px;'>$verificationCode</h3>
                <p>Ce code expirera dans <strong>5 minutes</strong>.</p>
            </div>";

            Mail::to($request->email)->send(new EmailService($subject, $content));

            VerificationCode::create([
                'email' => $request->email,
                'code' => $verificationCode,
                'expires_at' => now()->addMinutes(5),
            ]);
        });

        return response()->json(['message' => 'A verification code has been sent to your email.'], 200);
    }

    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'code' => 'required|numeric|digits:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $verification = VerificationCode::where('email', $request->email)
            ->where('code', $request->code)
            ->where('expires_at', '>', now())
            ->first();

        if (!$verification) {
            return response()->json(['error' => 'Invalid or expired code'], 400);
        }

        $user = DB::transaction(function () use ($request, $verification) {
            $user = User::create([
                'id' => Str::uuid(),
                'firstname' => $request->firstname,
                'lastname' => $request->lastname ?? '',
                'pseudo' => $request->pseudo,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'country' => $request->country ?? '',
                'role' => 'USER',
                'is_active' => true,
                'status' => 'online', // Statut initial
            ]);

            VerificationCode::where('email', $request->email)->delete();

            return $user;
        });

        $token = JWTAuth::fromUser($user);
        (new UserStatusChanged($user->id, 'online'))->broadcast();

        return response()->json([
            'token' => $token,
            'user_id' => $user->id,
            'role' => $user->role,
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $credentials = $request->only('email', 'password');

        if (!$token = JWTAuth::attempt($credentials)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        $user = JWTAuth::user();

        return response()->json([
            'token' => $token,
            'user_id' => $user->id,
            'role' => $user->role,
        ]);
    }

    public function logout()
    {
        $user = auth()->user();
        JWTAuth::invalidate(JWTAuth::getToken());
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me()
    {
        $user = JWTAuth::user()->load([
            'quizzes',
            'userResponses',
            'challengesAsPlayer1.player1',
            'challengesAsPlayer1.player2',
            'challengesAsPlayer2.player1',
            'challengesAsPlayer2.player2',
            'wonChallenges',
            'badges',
            'history',
            'friends',
            'friendOf',
            'posts',
            'likes',
            'comments'
        ]);
        return response()->json($user);
    }

    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['error' => 'Email not found'], 404);
        }

        $token = Str::random(60);
        $user->password_reset_token = $token;
        $user->password_reset_expires_at = Carbon::now()->addMinutes(15);
        $user->save();

        $subject = "Password Reset Request";
        $content = '<div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Password Reset</h2>
            <p>You have requested a password reset. Click the button below to proceed:</p>
            <a href="' . env('APP_URL_FRONTEND') . '/reset-password/' . $token . '" style="display: inline-block; background: #007BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Reset Password
            </a>
            <p>This link expires in <strong>15 minutes</strong>.</p>
        </div>';

        Mail::to($request->email)->send(new EmailService($subject, $content));

        return response()->json(['message' => 'A password reset link has been sent to your email.'], 200);
    }

    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('password_reset_token', $request->token)
            ->where('password_reset_expires_at', '>', Carbon::now())
            ->first();

        if (!$user) {
            return response()->json(['error' => 'Invalid or expired token'], 401);
        }

        $user->password = Hash::make($request->password);
        $user->password_reset_token = null;
        $user->password_reset_expires_at = null;
        $user->save();

        return response()->json(['message' => 'Password reset successfully'], 200);
    }

    public function redirectToFacebook()
    {
        return Socialite::driver('facebook')->stateless()->redirect();
    }

    public function handleFacebookCallback()
    {
        $socialUser = Socialite::driver('facebook')->stateless()->user();
        $user = $this->handleSocialLogin($socialUser->getEmail(), $socialUser->getName());
        $token = JWTAuth::fromUser($user);
        return redirect("http://localhost:3000/callback?token=$token");
    }

    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function handleGoogleCallback()
    {
        $socialUser = Socialite::driver('google')->stateless()->user();
        $user = $this->handleSocialLogin($socialUser->getEmail(), $socialUser->getName());
        $token = JWTAuth::fromUser($user);
        return redirect("http://localhost:3000/callback?token=$token");
    }

    private function handleSocialLogin($email, $name)
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'pseudo' => $name,
                'password' => Hash::make(Str::random(16)),
                'firstname' => $name,
                'role' => 'USER',
                'is_active' => true,
                'status' => 'online',
            ]
        );

        $user->status = 'online';
        $user->save();
        (new UserStatusChanged($user->id, 'online'))->broadcast();

        return $user;
    }
}