<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsAdminAkademik
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || !$request->user()->hasRole('admin akademik')) {
            if ($request->header('X-Inertia')) {
                return redirect()->route('dashboard')->with('error', 'Akses ditolak. Anda tidak memiliki izin admin akademik.');
            }
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $next($request);
    }
}
