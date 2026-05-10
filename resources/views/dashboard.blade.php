@extends('layouts.app')
@section('title', 'Panel — MenuGo')

@section('content')
<x-app-shell variant="restaurant" title="Tacos El Compa" subtitle="Resumen del día — {{ now()->translatedFormat('l j \d\e F') }}">

    {{-- KPI Cards --}}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @foreach([
            ['label'=>'Ventas hoy',   'value'=>'$2,847', 'delta'=>'+12.4%', 'icon'=>'dollar-sign'],
            ['label'=>'Pedidos',      'value'=>'184',     'delta'=>'+23%',   'icon'=>'shopping-bag'],
            ['label'=>'Clientes',     'value'=>'92',      'delta'=>'+8.1%',  'icon'=>'users'],
            ['label'=>'Ticket prom.', 'value'=>'$15.4',   'delta'=>'+3.2%',  'icon'=>'trending-up'],
        ] as $stat)
        <div class="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors">
            <div class="flex justify-between items-start">
                <div class="text-xs text-muted-foreground">{{ $stat['label'] }}</div>
                <div class="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                    <x-icon :name="$stat['icon']" class="h-4 w-4" />
                </div>
            </div>
            <div class="mt-3 font-display text-3xl font-bold">{{ $stat['value'] }}</div>
            <div class="mt-1 inline-flex items-center gap-1 text-xs text-accent">
                <x-icon name="arrow-up-right" class="h-3 w-3" />{{ $stat['delta'] }}
            </div>
        </div>
        @endforeach
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-3">
        {{-- Pedidos recientes --}}
        <div class="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="font-display text-lg font-bold">Pedidos recientes</h2>
                <button class="text-xs text-primary hover:underline">Ver todos</button>
            </div>
            <div class="divide-y divide-border">
                @foreach([
                    ['id'=>'#1284','item'=>'2x Tacos al pastor + Coca','total'=>'$8.50', 'status'=>'En cocina','time'=>'2 min'],
                    ['id'=>'#1283','item'=>'Burrito mixto',            'total'=>'$12.00','status'=>'Listo',    'time'=>'5 min'],
                    ['id'=>'#1282','item'=>'Quesadilla + nachos',      'total'=>'$15.20','status'=>'Entregado','time'=>'12 min'],
                    ['id'=>'#1281','item'=>'3x Tacos pollo',           'total'=>'$9.00', 'status'=>'Entregado','time'=>'18 min'],
                ] as $order)
                <div class="py-3 flex items-center justify-between gap-4">
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium">{{ $order['id'] }} · <span class="text-muted-foreground font-normal">{{ $order['item'] }}</span></div>
                        <div class="text-xs text-muted-foreground mt-0.5">hace {{ $order['time'] }}</div>
                    </div>
                    <div class="font-semibold text-sm">{{ $order['total'] }}</div>
                    <span class="text-xs px-2.5 py-1 rounded-full font-medium
                        {{ $order['status'] === 'En cocina' ? 'bg-primary/15 text-primary' :
                           ($order['status'] === 'Listo'    ? 'bg-accent/15 text-accent'   :
                           'bg-muted text-muted-foreground') }}">
                        {{ $order['status'] }}
                    </span>
                </div>
                @endforeach
            </div>
        </div>

        {{-- Top del día --}}
        <div class="rounded-2xl border border-border bg-card p-6">
            <h2 class="font-display text-lg font-bold mb-4">Top del día</h2>
            <div class="space-y-4">
                @foreach([
                    ['name'=>'Tacos al pastor',   'sold'=>47, 'revenue'=>'$211'],
                    ['name'=>'Burrito mixto',     'sold'=>32, 'revenue'=>'$384'],
                    ['name'=>'Quesadilla',        'sold'=>24, 'revenue'=>'$192'],
                    ['name'=>'Nachos especiales', 'sold'=>18, 'revenue'=>'$144'],
                ] as $i => $item)
                <div>
                    <div class="flex justify-between text-sm mb-1.5">
                        <span class="font-medium">{{ $i + 1 }}. {{ $item['name'] }}</span>
                        <span class="text-muted-foreground">{{ $item['revenue'] }}</span>
                    </div>
                    <div class="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div class="h-full bg-gradient-warm" style="width: {{ round(($item['sold'] / 47) * 100) }}%"></div>
                    </div>
                    <div class="text-xs text-muted-foreground mt-1">{{ $item['sold'] }} vendidos</div>
                </div>
                @endforeach
            </div>
        </div>
    </div>

</x-app-shell>
@endsection
