// Contenu de 0001_01_01_000000_create_users_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('firstname');
            $table->string('lastname')->nullable();
            $table->string('pseudo')->unique();
            $table->string('email')->unique();
            $table->string('avatar')->nullable();
            $table->string('country')->nullable();
            $table->text('bio')->nullable();
            $table->integer('xp')->default(0);
            $table->string('league')->default('Bronze');
            $table->integer('duel_wins')->default(0);
            $table->string('status')->default('offline');
            $table->boolean('is_active')->default(true);
            $table->enum('role', ['ADMIN', 'USER'])->default('USER');
            $table->string('password');
            $table->string('password_reset_token')->nullable();
            $table->timestamp('password_reset_expires_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->index(['xp', 'league']);
        });
        
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('sessions');
    }
};

// Contenu de 2025_02_26_130544_create_verification_codes_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('verification_codes', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('code');
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verification_codes');
    }
};

// Contenu de 2025_02_26_130545_create_categories_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->string('image')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};

// Contenu de 2025_02_26_130545_create_quizzes_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('categories')->onDelete('restrict');
            $table->text('description')->nullable();
            $table->enum('niveau', ['Facile', 'Moyen', 'Difficile']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};

// Contenu de 2025_02_26_130546_create_questions_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained('quizzes')->onDelete('cascade');
            $table->text('text');
            $table->integer('time_limit')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};

// Contenu de 2025_02_26_130547_create_answers_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            $table->text('text');
            $table->boolean('is_correct');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('answers');
    }
};

// Contenu de 2025_02_26_130547_create_user_responses_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            $table->foreignId('answer_id')->constrained('answers')->onDelete('cascade');
            $table->timestamp('created_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->index(['user_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_responses');
    }
};

// Contenu de 2025_02_26_130548_create_challenges_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('challenges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('quiz_id')->constrained('quizzes')->onDelete('cascade');
            $table->foreignUuid('player1_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('player2_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['pending', 'active', 'completed'])->default('pending');
            $table->integer('player1_score')->nullable();
            $table->integer('player2_score')->nullable();
            $table->integer('player1_bet')->default(0);
            $table->integer('player2_bet')->default(0);
            $table->foreignUuid('winner_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('challenges');
    }
};

// Contenu de 2025_02_26_130549_create_badges_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->text('condition')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('badges');
    }
};

// Contenu de 2025_02_26_130549_create_histories_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('histories', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', ['xp', 'badge', 'quiz', 'challenge', 'league']);
            $table->text('description');
            $table->integer('value')->nullable();
            $table->timestamp('created_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('histories');
    }
};

// Contenu de 2025_02_26_130549_create_user_badges_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_badges', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('badge_id')->constrained('badges')->onDelete('cascade');
            $table->timestamp('earned_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->unique(['user_id', 'badge_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_badges');
    }
};

// Contenu de 2025_02_26_130550_create_friends_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('friends', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('friend_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['pending', 'accepted'])->default('pending');
            $table->timestamps();
            $table->unique(['user_id', 'friend_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('friends');
    }
};

// Contenu de 2025_02_26_130550_create_posts_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->text('content');
            $table->enum('type', ['challenge', 'badge', 'league']);
            $table->bigInteger('related_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};

// Contenu de 2025_02_26_130551_create_comments_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('post_id')->constrained('posts')->onDelete('cascade');
            $table->text('content');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};

// Contenu de 2025_02_26_130551_create_likes_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('likes', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('post_id')->constrained('posts')->onDelete('cascade');
            $table->timestamp('created_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->unique(['user_id', 'post_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('likes');
    }
};

// Contenu de 2025_02_27_203815_create_challenge_quiz_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateChallengeQuizTable extends Migration
{
    public function up()
    {
        Schema::create('challenge_quizs', function (Blueprint $table) {
            $table->uuid('challenge_id');
            $table->unsignedBigInteger('quiz_id');
            $table->foreign('challenge_id')->references('id')->on('challenges')->onDelete('cascade');
            $table->foreign('quiz_id')->references('id')->on('quizzes')->onDelete('cascade');
            $table->primary(['challenge_id', 'quiz_id']);
        });

        // Supprimer l'ancienne colonne quiz_id si elle existe encore
        Schema::table('challenges', function (Blueprint $table) {
            if (Schema::hasColumn('challenges', 'quiz_id')) {
                $table->dropForeign(['quiz_id']);
                $table->dropColumn('quiz_id');
            }
        });
    }

    public function down()
    {
        Schema::dropIfExists('challenge_quizs');

        // Restaurer l'ancienne colonne si nÃ©cessaire
        Schema::table('challenges', function (Blueprint $table) {
            $table->unsignedBigInteger('quiz_id')->nullable();
            $table->foreign('quiz_id')->references('id')->on('quizzes')->onDelete('set null');
        });
    }
}

// Contenu de 2025_03_01_193527_add_challenge_sync_fields_to_challenges_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('challenges', function (Blueprint $table) {
            $table->text('shuffled_questions')->nullable()->after('winner_id'); // Stocke les questions mÃ©langÃ©es en JSON
            $table->integer('current_question_index')->default(0)->after('shuffled_questions'); // Index de la question actuelle
            $table->uuid('question_answered_by')->nullable()->after('current_question_index'); // ID du joueur ayant rÃ©pondu en premier
            $table->foreign('question_answered_by')->references('id')->on('users')->onDelete('set null'); // ClÃ© Ã©trangÃ¨re vers users
        });
    }

    public function down(): void
    {
        Schema::table('challenges', function (Blueprint $table) {
            $table->dropForeign(['question_answered_by']);
            $table->dropColumn(['shuffled_questions', 'current_question_index', 'question_answered_by']);
        });
    }
};

// Contenu de 2025_03_18_070508_create_category_q_c_m_s _table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCategoryQcmsTable extends Migration
{
    public function up()
    {
        Schema::create('category_q_c_m_s', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('category_q_c_m_s');
    }
}

// Contenu de 2025_03_18_070509_create_qcms_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQcmsTable extends Migration
{
    public function up()
    {
        Schema::create('qcms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->foreignUuid('category_qcm_id')->constrained('category_q_c_m_s')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('qcms');
    }
}

// Contenu de 2025_03_18_070510_create_question_qcms_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQuestionQcmsTable extends Migration
{
    public function up()
    {
        Schema::create('question_qcms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('text');
            $table->enum('type', ['MULTIPLE_CHOICE', 'TRUE_FALSE']);
            $table->timestamps();
            $table->foreignUuid('qcm_id')->constrained('qcms')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('question_qcms');
    }
}

// Contenu de 2025_03_18_070511_create_answer_qcms_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAnswerQcmsTable extends Migration
{
    public function up()
    {
        Schema::create('answer_qcms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('text');
            $table->boolean('is_correct');
            $table->timestamps();
            $table->foreignUuid('question_qcm_id')->constrained('question_qcms')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('answer_qcms');
    }
}

// Contenu de 2025_03_18_070512_create_examens_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateExamensTable extends Migration
{
    public function up()
    {
        Schema::create('examens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->integer('timer');
            $table->enum('status', ['DRAFT', 'PUBLISHED', 'ENDED'])->default('DRAFT');
            $table->timestamps();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('examens');
    }
}

// Contenu de 2025_03_18_070513_create_historique_qcms_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateHistoriqueQcmsTable extends Migration
{
    public function up()
    {
        Schema::create('historique_qcms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->text('description');
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('historique_qcms');
    }
}

// Contenu de 2025_03_18_070513_create_result_qcms_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateResultQcmsTable extends Migration
{
    public function up()
    {
        Schema::create('result_qcms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->float('score');
            $table->timestamp('submitted_at');
            $table->timestamps();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('examen_id')->constrained('examens')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('result_qcms');
    }
}

// Contenu de 2025_03_18_070514_create_examen_qcms_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateExamenQcmsTable extends Migration
{
    public function up()
    {
        Schema::create('examen_qcms', function (Blueprint $table) {
            $table->foreignUuid('examen_id')->constrained('examens')->onDelete('cascade');
            $table->foreignUuid('qcm_id')->constrained('qcms')->onDelete('cascade');
                        $table->primary(['examen_id', 'qcm_id']);
                        
        });
    }

    public function down()
    {
        Schema::dropIfExists('examen_qcms');
    }
}

// Contenu de 2025_03_18_185006_create_user_reponse_qcms_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUserReponseQcmsTable extends Migration
{
    public function up()
    {
        Schema::create('user_reponse_qcms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('examen_id')->constrained()->onDelete('cascade');
            $table->json('answers'); // Stocke les rÃ©ponses au format JSON
            $table->integer('score')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('user_reponse_qcms');
    }
}

+---app
|   |   favicon.ico
|   |   globals.css
|   |   layout.tsx
|   |   page.tsx
|   |   
|   +---(auth)
|   |   +---callback
|   |   |       page.tsx
|   |   |
|   |   +---forgot-password
|   |   |       page.tsx
|   |   |
|   |   +---login
|   |   |       page.tsx
|   |   |
|   |   +---register
|   |   |       page.tsx
|   |   |
|   |   +---reset-password
|   |   |   \---[token]
|   |   |           page.tsx
|   |   |
|   |   \---verify-otp
|   |           page.tsx
|   |
|   +---admin
|   |   |   layout.tsx
|   |   |   page.tsx
|   |   |
|   |   +---categories
|   |   |       page.tsx
|   |   |
|   |   +---category-qcms
|   |   |       page.tsx
|   |   |
|   |   +---dashboard
|   |   |       page.tsx
|   |   |
|   |   +---examens
|   |   |   |   page.tsx
|   |   |   |
|   |   |   \---historiques
|   |   |           page.tsx
|   |   |
|   |   +---profile
|   |   |       page.tsx
|   |   |
|   |   +---qcms
|   |   |       page.tsx
|   |   |
|   |   +---quizzes
|   |   |       page.tsx
|   |   |
|   |   +---settings
|   |   |       page.tsx
|   |   |
|   |   \---users
|   |           page.tsx
|   |
|   +---api
|   |   \---auth
|   |       \---[...nextauth]
|   |               route.ts
|   |
|   +---examen
|   |   |   layout.tsx
|   |   |   page.tsx
|   |   |
|   |   +---list
|   |   |       page.tsx
|   |   |
|   |   +---my-results
|   |   |       page.tsx
|   |   |
|   |   \---[id]
|   |       \---play
|   |               page.tsx
|   |
|   \---platform
|       |   layout.tsx
|       |   page.tsx
|       |
|       +---challenges
|       |   |   page.tsx
|       |   |
|       |   \---[id]
|       |       \---play
|       |               page.tsx
|       |
|       +---friends
|       |   |   page.tsx
|       |   |
|       |   \---[userId]
|       |           page.tsx
|       |
|       +---history
|       |       page.tsx
|       |
|       +---posts
|       |       page.tsx
|       |
|       +---quiz
|       |   \---[quizId]
|       |           page.tsx
|       |
|       \---settings
|               page.tsx
|
+---components
|   |   AddQuiz.tsx
|   |   AdminSidebar.tsx
|   |   AuthProvider.tsx
|   |   ChallengeList.tsx
|   |   ClientSessionProvider.tsx
|   |   CreateChallenge.tsx
|   |   Header.tsx
|   |   HeaderExamen.tsx
|   |   Loader.tsx
|   |   ModeToggle.tsx
|   |   Navbar.tsx
|   |   theme-provider.tsx
|   |
|   \---ui
|           alert-dialog.tsx
|           alert.tsx
|           avatar.tsx
|           badge.tsx
|           button.tsx
|           card.tsx
|           checkbox.tsx
|           command.tsx
|           dialog.tsx
|           dropdown-menu.tsx
|           form.tsx
|           input-otp.tsx
|           input.tsx
|           label.tsx
|           popover.tsx
|           progress.tsx
|           radio-group.tsx
|           scroll-area.tsx
|           select.tsx
|           separator.tsx
|           sheet.tsx
|           sidebar.tsx
|           skeleton.tsx
|           sonner.tsx
|           switch.tsx
|           table.tsx
|           tabs.tsx
|           textarea.tsx
|           tooltip.tsx
|
+---constant
|       index.js
|
+---context
+---hooks
|       use-mobile.tsx
|       useProtectedRoute.ts
|
+---lib
|       api.ts
|       echo.ts
|       socket.ts
|       utils.ts
|       
\---types
        index.ts

        PS G:\BOSSY\EXERCICE\NextJs FullStack> ls


    Répertoire : G:\BOSSY\EXERCICE\NextJs FullStack


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        21/03/2025     06:38                .next
d-----        21/03/2025     06:49                node_modules
d-----        21/03/2025     06:49                public
da----        21/03/2025     06:49                src
-a----        19/03/2025     11:57            475 .env.local
-a----        26/02/2025     13:19            480 .gitignore
-a----        26/02/2025     13:25            445 components.json
-a----        26/02/2025     13:19            393 eslint.config.mjs
-a----        26/02/2025     13:19            211 next-env.d.ts
-a----        26/02/2025     13:19            133 next.config.ts
-a----        21/03/2025     06:15         333721 package-lock.json
-a----        21/03/2025     06:08           2133 package.json
-a----        26/02/2025     13:19            135 postcss.config.mjs
-a----        19/03/2025     11:57           1458 README.md
-a----        18/03/2025     21:39           2090 tailwind.config.ts
-a----        26/02/2025     13:19            602 tsconfig.json

