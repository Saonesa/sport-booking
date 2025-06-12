<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Field;

class FieldSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Field::create([
            'name' => 'Lapangan Futsal A',
            'sport_type' => 'Futsal',
            'address' => 'Jl. Kebon Jeruk No. 10',
            'description' => 'Lapangan futsal indoor dengan fasilitas lengkap.',
            'price_per_hour' => 100000.00,
        ]);

        Field::create([
            'name' => 'Lapangan Badminton B',
            'sport_type' => 'Badminton',
            'address' => 'Jl. Pahlawan No. 5',
            'description' => 'Tiga lapangan badminton berkualitas tinggi.',
            'price_per_hour' => 50000.00,
        ]);

        Field::create([
            'name' => 'Lapangan Basket C',
            'sport_type' => 'Basketball',
            'address' => 'Jl. Merdeka No. 20',
            'description' => 'Lapangan basket outdoor dengan pencahayaan.',
            'price_per_hour' => 80000.00,
        ]);
    }
}