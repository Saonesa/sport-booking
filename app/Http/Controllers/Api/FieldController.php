<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Field;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FieldController extends Controller
{
    // READ all fields
    public function index()
    {
        $fields = Field::all();
        return response()->json($fields);
    }

    // CREATE a new field (Admin only)
    public function store(Request $request)
    {
        // Otorisasi: Hanya admin yang bisa membuat
        if (auth()->check() && auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized: Admin access required'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'sport_type' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price_per_hour' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $field = Field::create($request->all());
        return response()->json($field, 201);
    }

    // READ a single field
    public function show(Field $field)
    {
        return response()->json($field);
    }

    // UPDATE an existing field (Admin only)
    public function update(Request $request, Field $field)
    {
        // Otorisasi: Hanya admin yang bisa mengupdate
        if (auth()->check() && auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized: Admin access required'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'sport_type' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price_per_hour' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $field->update($request->all());
        return response()->json($field);
    }

    // DELETE a field (Admin only)
    public function destroy(Field $field)
    {
        // Otorisasi: Hanya admin yang bisa menghapus
        if (auth()->check() && auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized: Admin access required'], 403);
        }

        $field->delete();
        return response()->json(null, 204); // No content
    }
}