<?php 

namespace App\Http\Controllers;

use App\Models\HistoriqueQcm;

class HistoriqueQcmController extends Controller
{
    public function index()
    {
        return HistoriqueQcm::with('user')->get();
    }
}