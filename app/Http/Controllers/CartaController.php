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

        $tables = RestaurantTable::withCount(['activeOrders'])
            ->orderByRaw('CAST(number AS UNSIGNED), number')
            ->get()
            ->map(fn($t) => [
                'id'               => $t->id,
                'number'           => (string) $t->number,
                'has_active_orders' => $t->active_orders_count > 0,
            ]);

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
            'customer_name'     => 'required|string|max:150',
            'customer_phone'    => 'required|string|max:20|regex:/^[\d\s\+\-\(\)]+$/',
            'type'              => 'required|in:mesa,domicilio',
            'table_id'          => 'nullable|integer|exists:restaurant_tables,id',
            'delivery_address'  => 'required_if:type,domicilio|nullable|string|max:300',
            'delivery_phone'    => 'nullable|string|max:20|regex:/^[\d\s\+\-\(\)]+$/',
            'delivery_zone_idx' => 'nullable|integer|min:0',
            'delivery_lat'      => 'nullable|numeric|between:-90,90',
            'delivery_lng'      => 'nullable|numeric|between:-180,180',
            'payment_method'    => 'required|string|in:efectivo,pse,nequi,daviplata,tarjeta,transferencia',
            'notes'             => 'nullable|string|max:500',
            'confirmed'         => 'nullable|boolean',
            'items'             => 'required|array|min:1|max:50',
            'items.*.dish_id'   => 'required|integer|exists:dishes,id',
            'items.*.quantity'  => 'required|integer|min:1|max:99',
        ]);

        // Block orders on occupied tables unless the customer explicitly confirmed
        if ($data['type'] === 'mesa' && ! empty($data['table_id']) && empty($data['confirmed'])) {
            $table = \App\Models\RestaurantTable::find($data['table_id']);
            if ($table && $table->activeOrders()->exists()) {
                return redirect('/carta')->withErrors([
                    'table_occupied' => 'Esta mesa ya tiene un pedido activo.',
                ]);
            }
        }

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
            return redirect('/carta')->withErrors(['items' => 'Ningún plato del pedido está disponible.']);
        }

        // ── Lógica de domicilio ────────────────────────────────────────────────
        $deliveryFee = 0;
        if ($data['type'] === 'domicilio') {
            $cfg   = CartaSetting::firstOrCreate([]);
            $zones = $cfg->delivery_zones ?? [];

            // Validar pedido mínimo contra el subtotal de productos (sin tarifa)
            $minOrder = (int) ($cfg->delivery_min_order ?? 0);
            if ($minOrder > 0 && $total < $minOrder) {
                $fmtMin   = '$' . number_format($minOrder, 0, ',', '.');
                $fmtTotal = '$' . number_format($total,    0, ',', '.');
                return redirect('/carta')->withErrors([
                    'delivery_min_order' => "Pedido mínimo para domicilio: {$fmtMin}. Tu pedido es {$fmtTotal}.",
                ]);
            }

            // Zona requerida cuando hay zonas configuradas
            if (!empty($zones) && !isset($data['delivery_zone_idx'])) {
                return redirect('/carta')->withErrors([
                    'delivery_zone_idx' => 'Selecciona una zona de entrega para continuar.',
                ]);
            }

            // Validar que las coordenadas de entrega correspondan a la zona seleccionada
            if (
                !empty($zones)
                && isset($data['delivery_zone_idx'])
                && isset($data['delivery_lat'], $data['delivery_lng'])
                && $cfg->restaurant_lat
                && $cfg->restaurant_lng
            ) {
                $km          = $this->haversineKm(
                    (float) $cfg->restaurant_lat, (float) $cfg->restaurant_lng,
                    (float) $data['delivery_lat'],  (float) $data['delivery_lng']
                );
                $claimedZone = $zones[$data['delivery_zone_idx']] ?? null;
                if ($claimedZone) {
                    $withinZone = $km >= (float) $claimedZone['min_km'] && $km <= (float) $claimedZone['max_km'];
                    $coveredByAny = collect($zones)->contains(
                        fn($z) => $km >= (float) $z['min_km'] && $km <= (float) $z['max_km']
                    );
                    if (! $withinZone) {
                        $fmtKm = number_format($km, 1, '.', '');
                        if (! $coveredByAny) {
                            return redirect('/carta')->withErrors([
                                'delivery_address' => "La dirección está fuera de nuestra zona de cobertura ({$fmtKm} km).",
                            ]);
                        }
                        return redirect('/carta')->withErrors([
                            'delivery_zone_idx' => "La zona seleccionada no corresponde a tu dirección ({$fmtKm} km).",
                        ]);
                    }
                }
            }

            // Resolver tarifa de la zona seleccionada
            if (isset($data['delivery_zone_idx'])) {
                $zone = $zones[$data['delivery_zone_idx']] ?? null;
                if ($zone) {
                    $deliveryFee = (int) $zone['price'];
                }
            }
        }
        $total += $deliveryFee;

        $order = Order::create([
            'customer_name'     => $data['customer_name'],
            'customer_phone'    => $data['customer_phone'],
            'type'              => $data['type'],
            'table_id'          => $data['table_id'] ?? null,
            'delivery_address'  => $data['delivery_address'] ?? null,
            'delivery_phone'    => $data['delivery_phone'] ?? null,
            'delivery_fee'      => $deliveryFee,
            'payment_method'    => $data['payment_method'],
            'notes'             => $data['notes'] ?? null,
            'status'            => 'pending',
            'total'             => $total,
        ]);

        $order->items()->createMany($orderItems);

        // Marcar la mesa como ocupada automáticamente al recibir el pedido
        if ($data['type'] === 'mesa' && !empty($data['table_id'])) {
            \App\Models\RestaurantTable::where('id', $data['table_id'])
                ->update(['status' => 'occupied']);
        }

        return redirect('/carta')->with('order_placed', [
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
            'primary_color'            => 'required|regex:/^#[0-9A-Fa-f]{6}$/',
            'bg_color'                 => 'required|regex:/^#[0-9A-Fa-f]{6}$/',
            'text_color'               => 'required|regex:/^#[0-9A-Fa-f]{6}$/',
            'logo_size'                => 'required|in:sm,md,lg,xl',
            'name_size'                => 'required|in:sm,md,lg,xl,2xl',
            'slogan'                   => 'nullable|string|max:200',
            'slogan_size'              => 'required|in:xs,sm,md,lg',
            'payment_methods'          => 'required|array|min:1',
            'payment_methods.*'        => 'string|in:efectivo,pse,nequi,daviplata,tarjeta,transferencia',
            'social_links'             => 'nullable|array',
            'social_links.instagram'   => 'nullable|url|max:255',
            'social_links.facebook'    => 'nullable|url|max:255',
            'social_links.whatsapp'         => 'nullable|string|max:20|regex:/^\+?[0-9]{7,15}$/',
            'social_links.whatsapp_message' => 'nullable|string|max:500',
            'social_links.tiktok'      => 'nullable|url|max:255',
            'social_links.twitter'     => 'nullable|url|max:255',
            'social_links.youtube'     => 'nullable|url|max:255',
            'delivery_enabled'         => 'boolean',
            'delivery_min_order'       => 'nullable|integer|min:0',
            'delivery_zones'           => 'nullable|array|max:20',
            'delivery_zones.*.label'   => 'required|string|max:60',
            'delivery_zones.*.min_km'  => 'required|numeric|min:0',
            'delivery_zones.*.max_km'  => 'required|numeric',
            'delivery_zones.*.price'   => 'required|integer|min:0',
            'restaurant_lat'           => 'nullable|numeric|between:-90,90',
            'restaurant_lng'           => 'nullable|numeric|between:-180,180',
            'restaurant_address'       => 'nullable|string|max:300',
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

    private function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $R    = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a    = sin($dLat / 2) ** 2
              + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    private function settingsArray(CartaSetting $s): array
    {
        return [
            'primary_color'      => $s->primary_color,
            'bg_color'           => $s->bg_color,
            'text_color'         => $s->text_color,
            'logo_size'          => $s->logo_size,
            'name_size'          => $s->name_size,
            'slogan'             => $s->slogan,
            'slogan_size'        => $s->slogan_size,
            'banner_url'         => $s->banner_url,
            'payment_methods'    => $s->payment_methods    ?? ['efectivo'],
            'payment_details'    => $s->payment_details    ?? [],
            'social_links'       => $s->social_links       ?? [],
            'delivery_enabled'   => (bool) ($s->delivery_enabled   ?? false),
            'delivery_min_order' => (int)  ($s->delivery_min_order ?? 0),
            'delivery_zones'     => $s->delivery_zones     ?? [],
            'restaurant_lat'     => $s->restaurant_lat     ? (float) $s->restaurant_lat : null,
            'restaurant_lng'     => $s->restaurant_lng     ? (float) $s->restaurant_lng : null,
            'restaurant_address' => $s->restaurant_address ?? null,
            'google_maps_key'    => env('GOOGLE_MAPS_API_KEY') ?: null,
            'work_schedule'      => $s->work_schedule      ?? null,
        ];
    }
}
