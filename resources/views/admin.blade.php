@extends('layouts.app')
@section('title', 'SuperAdmin — MenuGo')

@section('content')
<x-app-shell variant="admin" title="Panel SuperAdmin" subtitle="Visibilidad global de todos los locales en MenuGo">

    {{-- KPIs --}}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @foreach([
            ['label'=>'Locales activos', 'value'=>'247',    'delta'=>'+18',   'icon'=>'building-2'],
            ['label'=>'MRR',             'value'=>'$48.2K', 'delta'=>'+12.4%','icon'=>'dollar-sign'],
            ['label'=>'Usuarios totales','value'=>'1,892',  'delta'=>'+96',   'icon'=>'users'],
            ['label'=>'Pedidos / 24h',   'value'=>'32,847', 'delta'=>'+23%',  'icon'=>'trending-up'],
        ] as $kpi)
        <div class="rounded-2xl border border-border bg-card p-5">
            <div class="flex justify-between">
                <div class="text-xs text-muted-foreground">{{ $kpi['label'] }}</div>
                <div class="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
                    <x-icon :name="$kpi['icon']" class="h-4 w-4" />
                </div>
            </div>
            <div class="mt-3 font-display text-3xl font-bold">{{ $kpi['value'] }}</div>
            <div class="mt-1 inline-flex items-center gap-1 text-xs text-accent">
                <x-icon name="arrow-up-right" class="h-3 w-3" />{{ $kpi['delta'] }}
            </div>
        </div>
        @endforeach
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-3">
        {{-- Tabla de locales --}}
        <div class="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
            <div class="p-6 flex justify-between items-center border-b border-border">
                <div>
                    <h2 class="font-display text-lg font-bold">Locales registrados</h2>
                    <p class="text-xs text-muted-foreground mt-0.5">Movimiento en tiempo real</p>
                </div>
                <input placeholder="Buscar local..."
                       class="h-9 rounded-lg border border-input bg-input px-3 text-sm w-48 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <table class="w-full text-sm">
                <thead class="text-xs uppercase text-muted-foreground bg-muted/30">
                    <tr>
                        <th class="text-left px-6 py-3 font-medium">Local</th>
                        <th class="text-left px-6 py-3 font-medium">Plan</th>
                        <th class="text-right px-6 py-3 font-medium">Ingresos mes</th>
                        <th class="text-right px-6 py-3 font-medium">Estado</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border">
                    @foreach([
                        ['name'=>'TacoLab',       'type'=>'Cadena · 4 locales','plan'=>'Pro',        'revenue'=>'$8,420',  'status'=>'Activo'],
                        ['name'=>'Sushi Nori',    'type'=>'Restaurante',       'plan'=>'Pro',        'revenue'=>'$5,210',  'status'=>'Activo'],
                        ['name'=>'Burger Forge',  'type'=>'Cadena · 2 locales','plan'=>'Enterprise', 'revenue'=>'$12,840', 'status'=>'Activo'],
                        ['name'=>'Arepa Street',  'type'=>'Food truck',        'plan'=>'Starter',    'revenue'=>'$420',    'status'=>'Activo'],
                        ['name'=>'Wok Express',   'type'=>'Food truck',        'plan'=>'Pro',        'revenue'=>'$1,840',  'status'=>'Trial'],
                        ['name'=>'El Asador',     'type'=>'Restaurante',       'plan'=>'Pro',        'revenue'=>'$6,720',  'status'=>'Activo'],
                        ['name'=>'La Trattoria',  'type'=>'Restaurante',       'plan'=>'Enterprise', 'revenue'=>'$9,310',  'status'=>'Activo'],
                    ] as $tenant)
                    <tr class="hover:bg-muted/30 transition-colors">
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="grid h-9 w-9 place-items-center rounded-lg bg-gradient-warm text-primary-foreground font-display font-bold">
                                    {{ substr($tenant['name'], 0, 1) }}
                                </div>
                                <div>
                                    <div class="font-medium">{{ $tenant['name'] }}</div>
                                    <div class="text-xs text-muted-foreground">{{ $tenant['type'] }}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="text-xs px-2 py-0.5 rounded-md font-medium
                                {{ $tenant['plan'] === 'Enterprise' ? 'bg-accent/20 text-accent'   :
                                   ($tenant['plan'] === 'Pro'        ? 'bg-primary/20 text-primary' :
                                   'bg-muted text-muted-foreground') }}">
                                {{ $tenant['plan'] }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right font-semibold">{{ $tenant['revenue'] }}</td>
                        <td class="px-6 py-4 text-right">
                            <span class="inline-flex items-center gap-1.5 text-xs {{ $tenant['status'] === 'Activo' ? 'text-accent' : 'text-muted-foreground' }}">
                                <span class="h-1.5 w-1.5 rounded-full {{ $tenant['status'] === 'Activo' ? 'bg-accent' : 'bg-muted-foreground' }}"></span>
                                {{ $tenant['status'] }}
                            </span>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        {{-- Sidebar derecha --}}
        <div class="space-y-6">
            <div class="rounded-2xl border border-border bg-card p-6">
                <div class="flex items-center gap-2 mb-4">
                    <x-icon name="globe-2" class="h-4 w-4 text-primary" />
                    <h2 class="font-display text-lg font-bold">Por tipo</h2>
                </div>
                <div class="space-y-3">
                    @foreach([
                        ['t'=>'Restaurantes',       'n'=>142,'c'=>'bg-primary'],
                        ['t'=>'Food trucks',        'n'=>68, 'c'=>'bg-accent'],
                        ['t'=>'Puestos callejeros', 'n'=>27, 'c'=>'bg-orange-500'],
                        ['t'=>'Cafeterías / Bar',   'n'=>10, 'c'=>'bg-blue-500'],
                    ] as $row)
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span>{{ $row['t'] }}</span>
                            <span class="font-semibold">{{ $row['n'] }}</span>
                        </div>
                        <div class="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div class="h-full {{ $row['c'] }}" style="width: {{ round(($row['n'] / 142) * 100) }}%"></div>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>

            <div class="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 text-primary-foreground">
                <div class="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
                <div class="text-xs uppercase tracking-wider opacity-80">Próximo hito</div>
                <div class="font-display text-3xl font-bold mt-2">250 locales</div>
                <div class="mt-2 text-sm opacity-90">Te faltan solo 3 para alcanzarlo.</div>
            </div>
        </div>
    </div>

</x-app-shell>
@endsection
