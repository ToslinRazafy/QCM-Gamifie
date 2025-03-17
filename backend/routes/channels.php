<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('public-user-status', function () {
    // Canal public accessible à tous
    return true;
});

Broadcast::channel('private-user-{userId}', function ($user, $userId) {
    // Canal privé pour chaque utilisateur, sécurisé par authentification
    return auth()->check() && $user->id === $userId;
});