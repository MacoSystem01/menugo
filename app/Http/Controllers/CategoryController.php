<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::withCount('dishes')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn($c) => [
                'id'          => $c->id,
                'name'        => $c->name,
                'description' => $c->description,
                'active'      => $c->active,
                'sort_order'  => $c->sort_order,
                'dishes_count'=> $c->dishes_count,
            ]);

        return Inertia::render('Menu/Categories', compact('categories'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'sort_order'  => 'nullable|integer|min:1',
        ]);

        $desired = isset($data['sort_order']) ? (int) $data['sort_order']
                                              : ((Category::max('sort_order') ?? 0) + 1);

        // Make room: shift every row at or after the desired position down by 1
        Category::where('sort_order', '>=', $desired)->increment('sort_order');

        $category = Category::create([
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'sort_order'  => $desired,
            'active'      => true,
        ]);

        AuditLog::registrar('create', 'Categoría', $category->id, "Categoría '{$category->name}' creada", [
            'sort_order' => $category->sort_order,
        ]);

        return back()->with('success', "Categoría '{$data['name']}' creada.");
    }

    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'sort_order'  => 'nullable|integer|min:1',
            'active'      => 'boolean',
        ]);

        $newOrder = isset($data['sort_order']) ? (int) $data['sort_order'] : $category->sort_order;
        $oldOrder = $category->sort_order;

        if ($newOrder !== $oldOrder) {
            if ($newOrder > $oldOrder) {
                // Moving down: close the gap left behind, pull everything in between up
                Category::where('id', '!=', $category->id)
                    ->whereBetween('sort_order', [$oldOrder + 1, $newOrder])
                    ->decrement('sort_order');
            } else {
                // Moving up: push everything in between down to make room
                Category::where('id', '!=', $category->id)
                    ->whereBetween('sort_order', [$newOrder, $oldOrder - 1])
                    ->increment('sort_order');
            }
        }

        $old = $category->getAttributes();
        $category->update([
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'sort_order'  => $newOrder,
            'active'      => array_key_exists('active', $data) ? $data['active'] : $category->active,
        ]);

        AuditLog::registrar('update', 'Categoría', $category->id, "Categoría '{$category->name}' actualizada", [
            'old' => array_intersect_key($old, $data),
            'new' => $data,
        ]);

        return back()->with('success', 'Categoría actualizada.');
    }

    public function reorder(Request $request, Category $category)
    {
        $direction = $request->validate(['direction' => 'required|in:up,down'])['direction'];

        $neighbor = $direction === 'up'
            ? Category::where('sort_order', '<', $category->sort_order)->orderByDesc('sort_order')->first()
            : Category::where('sort_order', '>', $category->sort_order)->orderBy('sort_order')->first();

        if ($neighbor) {
            $tmp = $neighbor->sort_order;
            $neighbor->update(['sort_order' => $category->sort_order]);
            $category->update(['sort_order' => $tmp]);
        }

        return back();
    }

    public function destroy(Category $category)
    {
        if ($category->dishes()->exists()) {
            return back()->withErrors(['error' => 'No se puede eliminar: tiene platos asociados.']);
        }

        $name = $category->name;
        $id   = $category->id;
        $category->delete();

        AuditLog::registrar('delete', 'Categoría', $id, "Categoría '{$name}' eliminada");

        return back()->with('success', 'Categoría eliminada.');
    }
}
