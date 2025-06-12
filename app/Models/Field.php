<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Field extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'sport_type',
        'address',
        'description',
        'price_per_hour',
    ];

    // Field has many reservations
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    /**
     * Get available timeslots for a given date.
     * This is a simplified example, you might need more complex logic.
     * @param string $date_ YYYY-MM-DD format
     * @return array
     */
    public function getAvailableTimeSlots(string $date_)
    {
        // Define standard operating hours (e.g., 08:00 to 22:00)
        $opening = 8 * 60; // 8:00 AM in minutes
        $closing = 22 * 60; // 10:00 PM in minutes

        $bookedSlots = $this->reservations()
            ->where('reservation_date', $date_)
            ->whereIn('status', ['pending', 'confirmed']) // Consider pending and confirmed as booked
            ->select('start_time', 'end_time')
            ->get();

        $allSlots = [];
        for ($i = $opening; $i < $closing; $i += 60) { // 1-hour slots
            $start = sprintf('%02d:00', floor($i / 60));
            $end = sprintf('%02d:00', floor(($i + 60) / 60)); // End of 1-hour slot

            $isBooked = false;
            foreach ($bookedSlots as $booked) {
                $bookedStart = strtotime($booked->start_time);
                $bookedEnd = strtotime($booked->end_time);
                $currentSlotStart = strtotime($start);
                $currentSlotEnd = strtotime($end);

                // Check for overlap
                if ($currentSlotStart < $bookedEnd && $bookedStart < $currentSlotEnd) {
                    $isBooked = true;
                    break;
                }
            }

            if (!$isBooked) {
                $allSlots[] = [
                    'start' => $start,
                    'end' => $end,
                    'is_booked' => false
                ];
            } else {
                 $allSlots[] = [
                    'start' => $start,
                    'end' => $end,
                    'is_booked' => true
                ];
            }
        }
        return $allSlots;
    }
}