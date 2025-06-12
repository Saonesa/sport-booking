<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Field;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ReservationController extends Controller
{
    // Admin: Get all reservations
    public function index()
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized: Admin access required'], 403);
        }
        $reservations = Reservation::with(['user', 'field'])->orderBy('reservation_date', 'desc')->get();
        return response()->json($reservations);
    }

    // User: Get their own reservations
    public function myReservations()
    {
        $reservations = auth()->user()->reservations()->with('field')->orderBy('reservation_date', 'desc')->get();
        return response()->json($reservations);
    }

    // Get available time slots for a specific field and date
    public function getAvailableSlots(Request $request, Field $field)
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date_format:Y-m-d|after_or_equal:today',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $date = $request->date;
        $availableSlots = $field->getAvailableTimeSlots($date);

        return response()->json($availableSlots);
    }


    // User: Create a new reservation
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'field_id' => 'required|exists:fields,id',
            'reservation_date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $field = Field::findOrFail($request->field_id);
        $user = auth()->user();

        // Check for availability
        $isBooked = Reservation::where('field_id', $field->id)
            ->where('reservation_date', $request->reservation_date)
            ->whereIn('status', ['pending', 'confirmed'])
            ->where(function ($query) use ($request) {
                // Check for overlapping times
                $query->where(function ($q) use ($request) {
                    $q->where('start_time', '<', $request->end_time)
                      ->where('end_time', '>', $request->start_time);
                });
            })
            ->exists();

        if ($isBooked) {
            return response()->json(['message' => 'The selected time slot is already booked.'], 409);
        }

        $reservation = Reservation::create([
            'field_id' => $field->id,
            'user_id' => $user->id,
            'reservation_date' => $request->reservation_date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'status' => 'pending', // Default status
        ]);

        return response()->json([
            'message' => 'Reservation created successfully!',
            'reservation' => $reservation->load(['user', 'field']),
        ], 201);
    }

    // Admin: Update reservation status
    public function updateStatus(Request $request, Reservation $reservation)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized: Admin access required'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,confirmed,canceled,completed',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $reservation->status = $request->status;
        $reservation->save();

        return response()->json([
            'message' => 'Reservation status updated successfully!',
            'reservation' => $reservation->load(['user', 'field']),
        ]);
    }

    // User/Admin: Cancel/Delete a reservation
    public function destroy(Reservation $reservation)
    {
        $user = auth()->user();

        // User can only cancel their own reservations
        if ($user->role === 'user' && $reservation->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized: You can only cancel your own reservations'], 403);
        }

        // Admin can delete any reservation
        if ($user->role === 'admin') {
            $reservation->delete();
            return response()->json(['message' => 'Reservation deleted successfully!'], 204);
        }

        // User can only cancel (change status to canceled), not delete permanently
        if ($user->role === 'user' && $reservation->status === 'pending') {
            $reservation->status = 'canceled';
            $reservation->save();
            return response()->json(['message' => 'Reservation canceled successfully!'], 200);
        } else if ($user->role === 'user' && $reservation->status !== 'pending') {
            return response()->json(['message' => 'Cannot cancel reservation with status ' . $reservation->status], 403);
        }

        return response()->json(['message' => 'Forbidden'], 403); // Fallback for any unhandled case
    }
}