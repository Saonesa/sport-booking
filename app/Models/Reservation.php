<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'field_id',
        'user_id',
        'reservation_date',
        'start_time',
        'end_time',
        'status',
    ];

    protected $casts = [
        'reservation_date' => 'date',
        'start_time' => 'datetime:H:i', // Cast as datetime for easier formatting
        'end_time' => 'datetime:H:i',
    ];

    // Reservation belongs to a user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Reservation belongs to a field
    public function field()
    {
        return $this->belongsTo(Field::class);
    }
}