<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FieldController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\UserController; // Import UserController
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Rute publik (tanpa otentikasi)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/fields', [FieldController::class, 'index']); // Get all fields
Route::get('/fields/{field}', [FieldController::class, 'show']); // Get single field
Route::get('/fields/{field}/available-slots', [ReservationController::class, 'getAvailableSlots']); // New route for slots

// Rute yang memerlukan otentikasi (gunakan middleware 'auth:sanctum')
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Rute untuk User & Admin
    Route::post('/reservations', [ReservationController::class, 'store']); // Buat reservasi
    Route::get('/my-reservations', [ReservationController::class, 'myReservations']); // Lihat reservasi sendiri
    Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy']); // Batalkan/Hapus reservasi

    // Rute khusus Admin (gunakan middleware 'admin')
    Route::middleware('admin')->group(function () {
        Route::apiResource('fields', FieldController::class)->except(['index', 'show']); // CRUD fields for admin
        Route::get('/reservations', [ReservationController::class, 'index']); // Lihat semua reservasi
        Route::put('/reservations/{reservation}/status', [ReservationController::class, 'updateStatus']); // Update status reservasi
        Route::apiResource('users', UserController::class); // CRUD users for admin
    });
});