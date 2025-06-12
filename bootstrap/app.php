<?php

use App\Http\Middleware\AdminMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
// use App\Http\Middleware\Authenticate; // HAPUS BARIS INI JIKA ADA DAN MENGACU PADA APP/HTTP/MIDDLEWARE

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
             EnsureFrontendRequestsAreStateful::class,
        ]);

        $middleware->alias([
            // Pastikan baris ini MENGGUNAKAN \Illuminate\Auth\Middleware\Authenticate::class
            'auth' => \Illuminate\Auth\Middleware\Authenticate::class,
            'admin' => AdminMiddleware::class,
            'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class, // Ini juga harus ada jika ada
            'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
            'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Konfigurasi penanganan eksepsi
    })->create();