<?php

namespace App\Http\Controllers;

use App\Models\CartaSetting;
use App\Models\Category;
use App\Models\Dish;
use App\Models\Order;
use App\Models\RestaurantTable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CartaController extends Controller
{
    // ── Vista pública ─────────────────────────────────────────────────────────

    public function public()
    {
        $settings = CartaSetting::firstOrCreate([]);

        $categories = Category::with([
                'dishes' => fn($q) => $q->where('available', true)->orderBy('sort_order')->orderBy('name'),
            ])
            ->where('active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->filter(fn($c) => $c->dishes->isNotEmpty())
            ->map(fn($c) => [
                'id'          => $c->id,
                'name'        => $c->name,
                'description' => $c->description,
                'dishes'      => $c->dishes->map(fn($d) => [
                    'id'          => $d->id,
                    'name'        => $d->name,
                    'description' => $d->description,
                    'price'       => (float) $d->price,
                    'image_url'   => $d->image ? Storage::disk('public')->url($d->image) : null,
                ]),
            ])
            ->values();

        $tables = RestaurantTable::orderByRaw('CAST(number AS UNSIGNED), number')
            ->get(['id', 'number'])
            ->map(fn($t) => ['id' => $t->id, 'number' => (string) $t->number]);

        $tenantName = tenancy()->tenant?->name ?? config('app.name');

        return Inertia::render('PublicMenu', [
            'categories'  => $categories,
            'tenant_name' => $tenantName,
            'settings'    => $this->settingsArray($settings),
            'tables'      => $tables,
        ]);
    }

    // ── Realizar pedido desde la carta pública ────────────────────────────────

    public function placeOrder(Request $request)
    {
        $data = $request->validate([
            'customer_name'    => 'required|string|max:150',
            'customer_phone'   => 'required|string|max:20',
            'type'             => 'required|in:mesa,domicilio',
            'table_id'         => 'nullable|integer|exists:restaurant_tables,id',
            'delivery_address' => 'nullable|string|max:300',
            'payment_method'   => 'required|string|max:50',
            'notes'            => 'nullable|string|max:500',
            'items'            => 'required|array|min:1',
            'items.*.dish_id'  => 'required|integer|exists:dishes,id',
            'items.*.quantity' => 'required|integer|min:1|max:99',
        ]);

        // Resolve prices from DB to avoid client-side tampering
        $total      = 0;
        $orderItems = [];

        foreach ($data['items'] as $item) {
            $dish = Dish::where('id', $item['dish_id'])->where('available', true)->first();
            if (! $dish) continue;

            $total += $dish->price * $item['quantity'];
            $orderItems[] = [
                'dish_id'    => $dish->id,
                'quantity'   => $item['quantity'],
                'unit_price' => (float) $dish->price,
            ];
        }

        if (empty($orderItems)) {
            return back()->withErrors(['items' => 'Ningún plato del pedido está disponible.']);
        }

        $order = Order::create([
            'customer_name'    => $data['customer_name'],
            'customer_phone'   => $data['customer_phone'],
            'type'             => $data['type'],
            'table_id'         => $data['table_id'] ?? null,
            'delivery_address' => $data['delivery_address'] ?? null,
            'payment_method'   => $data['payment_method'],
            'notes'            => $data['notes'] ?? null,
            'status'           => 'pending',
            'total'            => $total,
        ]);

        $order->items()->createMany($orderItems);

        return back()->with('order_placed', [
            'id'    => $order->id,
            'total' => (float) $total,
        ]);
    }

    // ── Vista admin: carta builder + QR ──────────────────────────────────────

    public function admin(Request $request)
    {
        $settings = CartaSetting::firstOrCreate([]);

        $categories = Category::with([
                'dishes' => fn($q) => $q->orderBy('sort_order')->orderBy('name'),
            ])
            ->where('active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn($c) => [
                'id'          => $c->id,
                'name'        => $c->name,
                'description' => $c->description,
                'dishes'      => $c->dishes->map(fn($d) => [
                    'id'          => $d->id,
                    'name'        => $d->name,
                    'description' => $d->description,
                    'price'       => (float) $d->price,
                    'available'   => $d->available,
                    'image_url'   => $d->image ? Storage::disk('public')->url($d->image) : null,
                    'image'       => $d->image,
                ]),
            ]);

        $publicUrl  = $request->getSchemeAndHttpHost() . '/carta';
        $tenantName = tenancy()->tenant?->name ?? config('app.name');

        return Inertia::render('Menu/Carta', [
            'categories'  => $categories,
            'public_url'  => $publicUrl,
            'tenant_name' => $tenantName,
            'settings'    => $this->settingsArray($settings),
        ]);
    }

    // ── Guardar diseño ────────────────────────────────────────────────────────

    public function saveSettings(Request $request)
    {
        $data = $request->validate([
            'primary_color'          => 'required|regex:/^#[0-9A-Fa-f]{6}$/',
            'bg_color'               => 'required|regex:/^#[0-9A-Fa-f]{6}$/',
            'text_color'             => 'required|regex:/^#[0-9A-Fa-f]{6}$/',
            'logo_size'              => 'required|in:sm,md,lg,xl',
            'name_size'              => 'required|in:sm,md,lg,xl,2xl',
            'slogan'                 => 'nullable|string|max:200',
            'slogan_size'            => 'required|in:xs,sm,md,lg',
            'payment_methods'        => 'required|array|min:1',
            'payment_methods.*'      => 'string|in:efectivo,pse,nequi,daviplata,tarjeta,transferencia',
            'social_links'           => 'nullable|array',
            'social_links.instagram' => 'nullable|url|max:255',
            'social_links.facebook'  => 'nullable|url|max:255',
            'social_links.whatsapp'  => 'nullable|string|max:20|regex:/^\+?[0-9]{7,15}$/',
            'social_links.tiktok'    => 'nullable|url|max:255',
            'social_links.twitter'   => 'nullable|url|max:255',
            'social_links.youtube'   => 'nullable|url|max:255',
        ]);

        // Store only non-empty social links
        if (isset($data['social_links'])) {
            $data['social_links'] = array_filter($data['social_links'], fn($v) => $v !== null && $v !== '');
        }

        CartaSetting::firstOrCreate([])->update($data);

        return back()->with('success', 'Diseño guardado.');
    }

    // ── Banner ────────────────────────────────────────────────────────────────

    public function uploadBanner(Request $request)
    {
        $request->validate([
            'banner' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $settings = CartaSetting::firstOrCreate([]);

        if ($settings->banner_image) {
            Storage::disk('public')->delete($settings->banner_image);
        }

        $path = $request->file('banner')->store('banners', 'public');
        $settings->update(['banner_image' => $path]);

        return back()->with('success', 'Banner actualizado.');
    }

    public function deleteBanner()
    {
        $settings = CartaSetting::firstOrCreate([]);

        if ($settings->banner_image) {
            Storage::disk('public')->delete($settings->banner_image);
            $settings->update(['banner_image' => null]);
        }

        return back()->with('success', 'Banner eliminado.');
    }

    // ── Imagen de plato ───────────────────────────────────────────────────────

    public function uploadImage(Request $request, Dish $dish)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($dish->image) {
            Storage::disk('public')->delete($dish->image);
        }

        $path = $request->file('image')->store('dishes', 'public');
        $dish->update(['image' => $path]);

        return back()->with('success', 'Imagen actualizada.');
    }

    public function deleteImage(Dish $dish)
    {
        if ($dish->image) {
            Storage::disk('public')->delete($dish->image);
            $dish->update(['image' => null]);
        }

        return back()->with('success', 'Imagen eliminada.');
    }

    // ── Datos del plato ───────────────────────────────────────────────────────

    public function updateDish(Request $request, Dish $dish)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:150',
            'description' => 'nullable|string|max:500',
            'price'       => 'required|numeric|min:0',
            'available'   => 'boolean',
        ]);

        $dish->update($data);

        return back()->with('success', 'Plato actualizado.');
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private function settingsArray(CartaSetting $s): array
    {
        return [
            'primary_color'   => $s->primary_color,
            'bg_color'        => $s->bg_color,
            'text_color'      => $s->text_color,
            'logo_size'       => $s->logo_size,
            'name_size'       => $s->name_size,
            'slogan'          => $s->slogan,
            'slogan_size'     => $s->slogan_size,
            'banner_url'      => $s->banner_url,
            'payment_methods' => $s->payment_methods ?? ['efectivo'],
            'social_links'    => $s->social_links    ?? [],
        ];
    }
}
