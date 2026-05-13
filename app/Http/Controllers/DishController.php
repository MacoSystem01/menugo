<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Dish;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DishController extends Controller
{
    public function index()
    {
        $dishes = Dish::with('category')
            ->join('categories', 'dishes.category_id', '=', 'categories.id')
            ->select('dishes.*')
            ->orderBy('categories.sort_order')
            ->orderBy('categories.name')
            ->orderBy('dishes.sort_order')
            ->orderBy('dishes.name')
            ->get()
            ->map(fn($d) => [
                'id'          => $d->id,
                'name'        => $d->name,
                'description' => $d->description,
                'price'       => (float) $d->price,
                'available'   => $d->available,
                'sort_order'  => $d->sort_order,
                'category_id' => $d->category_id,
                'category'    => $d->category?->name,
            ]);

        $categories = Category::where('active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Menu/Dishes', compact('dishes', 'categories'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name'        => 'required|string|max:150',
            'description' => 'nullable|string|max:500',
            'price'       => 'required|numeric|min:0',
            'sort_order'  => 'nullable|integer|min:0',
        ]);

        Dish::create([
            'category_id' => $data['category_id'],
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'price'       => $data['price'],
            'sort_order'  => $data['sort_order'] ?? 0,
            'available'   => true,
        ]);

        return back()->with('success', "Plato '{$data['name']}' creado.");
    }

    public function update(Request $request, Dish $dish)
    {
        $data = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name'        => 'required|string|max:150',
            'description' => 'nullable|string|max:500',
            'price'       => 'required|numeric|min:0',
            'sort_order'  => 'nullable|integer|min:0',
            'available'   => 'boolean',
        ]);

        $dish->update($data);

        return back()->with('success', 'Plato actualizado.');
    }

    public function destroy(Dish $dish)
    {
        $dish->delete();

        return back()->with('success', 'Plato eliminado.');
    }
}
