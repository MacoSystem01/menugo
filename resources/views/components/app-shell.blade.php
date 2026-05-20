@props(['variant' => 'restaurant', 'title', 'subtitle' => null])

@php
$restaurantNav = [
    ['href' => '/dashboard',   'label' => 'Inicio',      'icon' => 'home'],
    ['href' => '/usuarios',    'label' => 'Usuarios',    'icon' => 'users'],
    [
        'label'    => 'Menú',
        'icon'     => 'utensils',
        'children' => [
            ['href' => '/menu/categorias', 'label' => 'Categoría'],
            ['href' => '/menu/platos',     'label' => 'Plato'],
        ],
    ],
    ['href' => '/caja',        'label' => 'Caja',        'icon' => 'dollar-sign'],
    ['href' => '/pedidos',     'label' => 'Pedidos',     'icon' => 'shopping-bag'],
    [
        'label'    => 'Cocina',
        'icon'     => 'flame',
        'children' => [
            ['href' => '/cocina',           'label' => 'Cocina'],
            ['href' => '/cocina/novedades', 'label' => 'Novedades'],
        ],
    ],
    ['href' => '/tables',      'label' => 'Mesa',        'icon' => 'layout-dashboard'],
    ['href' => '/domicilio',   'label' => 'Domicilio',   'icon' => 'map-pin'],
    ['href' => '/inventario',  'label' => 'Inventario',  'icon' => 'package'],
    ['href' => '/reporte',     'label' => 'Reporte',     'icon' => 'file-bar-chart'],
];

$adminNav = [
    ['href' => '/admin',           'label' => 'Global',      'icon' => 'layout-dashboard'],
    ['href' => '/admin/tenants',   'label' => 'Locales',     'icon' => 'building-2'],
    ['href' => '/admin/analytics', 'label' => 'Analítica',   'icon' => 'bar-chart-3'],
    ['href' => '/admin/billing',   'label' => 'Facturación', 'icon' => 'credit-card'],
];

$nav = $variant === 'admin' ? $adminNav : $restaurantNav;

// Detecta si algún hijo del subMenu está activo para abrir el details por defecto
$menuChildActive   = request()->is('menu/*');
$cocinaChildActive = request()->is('cocina') || request()->is('cocina/*');
@endphp

<div class="min-h-screen flex bg-background">

    {{-- ══ Sidebar ══ --}}
    <aside class="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">

        {{-- Logo --}}
        <a href="{{ url('/') }}" class="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
            <img src="{{ asset('logo-trans.png') }}" alt="MenuGo" class="h-10 w-auto" />
            <span class="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {{ $variant === 'admin' ? 'SuperAdmin' : 'Restaurante' }}
            </span>
        </a>

        {{-- Navegación --}}
        <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            @foreach ($nav as $item)

                @if (isset($item['children']))
                    {{-- ── SubMenu desplegable ── --}}
                    @php
                        $open = match($item['label']) {
                            'Menú'   => $menuChildActive,
                            'Cocina' => $cocinaChildActive,
                            default  => collect($item['children'])->contains(fn($c) => request()->is(ltrim($c['href'], '/'))),
                        };
                    @endphp
                    <details {{ $open ? 'open' : '' }} class="group/menu">
                        <summary
                            class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium cursor-pointer list-none
                                   {{ $open
                                       ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                       : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground' }}
                                   transition-colors select-none">
                            <x-icon :name="$item['icon']" class="h-4 w-4 shrink-0" />
                            <span class="flex-1">{{ $item['label'] }}</span>
                            <x-icon name="chevron-down"
                                    class="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-open/menu:rotate-180" />
                        </summary>

                        <div class="mt-0.5 ml-3 pl-4 border-l border-sidebar-border space-y-0.5 pb-1">
                            @foreach ($item['children'] as $child)
                                @php $childActive = request()->is(ltrim($child['href'], '/')); @endphp
                                <a href="{{ url($child['href']) }}"
                                   class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors
                                          {{ $childActive
                                              ? 'bg-primary/15 text-primary font-semibold'
                                              : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground' }}">
                                    <span class="h-1.5 w-1.5 rounded-full {{ $childActive ? 'bg-primary' : 'bg-muted-foreground/40' }} shrink-0"></span>
                                    {{ $child['label'] }}
                                </a>
                            @endforeach
                        </div>
                    </details>

                @else
                    {{-- ── Ítem simple ── --}}
                    @php $active = request()->is(ltrim($item['href'], '/')); @endphp
                    <a href="{{ url($item['href']) }}"
                       class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors
                              {{ $active
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground' }}">
                        <x-icon :name="$item['icon']" class="h-4 w-4 shrink-0" />
                        {{ $item['label'] }}
                    </a>
                @endif

            @endforeach
        </nav>

        {{-- Pie del sidebar --}}
        <div class="border-t border-sidebar-border px-3 py-4">
            <a href="{{ url('/login') }}"
               class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground
                      hover:bg-red-500/10 hover:text-red-400 transition-colors">
                <x-icon name="log-out" class="h-4 w-4" /> Cerrar sesión
            </a>
        </div>
    </aside>

    {{-- ══ Contenido principal ══ --}}
    <main class="flex-1 overflow-x-hidden">
        <header class="sticky top-0 z-10 glass border-b border-border px-6 lg:px-10 py-5">
            <h1 class="font-display text-2xl font-bold">{{ $title }}</h1>
            @if ($subtitle)
                <p class="text-sm text-muted-foreground mt-0.5">{{ $subtitle }}</p>
            @endif
        </header>
        <div class="px-6 lg:px-10 py-8">
            {{ $slot }}
        </div>
    </main>

</div>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        const allDetails = document.querySelectorAll('aside details');
        allDetails.forEach(detail => {
            detail.addEventListener('toggle', () => {
                if (detail.open) {
                    allDetails.forEach(other => {
                        if (other !== detail) other.open = false;
                    });
                }
            });
        });
    });
</script>
