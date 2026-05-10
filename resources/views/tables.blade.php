@extends('layouts.app')
@section('title', 'Mesas — MenuGo')

@section('content')
<x-app-shell variant="restaurant" title="Gestión de Mesas" subtitle="Plano del restaurante en tiempo real">

    <div class="flex items-center gap-4 mb-6">
        <div class="flex items-center gap-2 text-sm"><div class="w-3 h-3 rounded-full bg-muted-foreground"></div> Libre</div>
        <div class="flex items-center gap-2 text-sm"><div class="w-3 h-3 rounded-full bg-accent"></div> Ocupada</div>
        <div class="flex items-center gap-2 text-sm"><div class="w-3 h-3 rounded-full bg-yellow-500"></div> Limpieza</div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 p-8 bg-card border border-border rounded-2xl relative overflow-hidden">
        @foreach([
            ['id'=>'T1','status'=>'free',     'seats'=>2],
            ['id'=>'T2','status'=>'occupied', 'seats'=>4, 'time'=>'45m','bill'=>'$42.50'],
            ['id'=>'T3','status'=>'cleaning', 'seats'=>4],
            ['id'=>'T4','status'=>'free',     'seats'=>6],
            ['id'=>'T5','status'=>'occupied', 'seats'=>2, 'time'=>'12m','bill'=>'$18.00'],
            ['id'=>'T6','status'=>'free',     'seats'=>2],
        ] as $table)
        <div class="relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all cursor-pointer hover:scale-105
            {{ $table['status'] === 'free'     ? 'border-muted-foreground/30 bg-background' :
               ($table['status'] === 'occupied' ? 'border-accent bg-accent/10'               :
               'border-yellow-500/50 bg-yellow-500/10') }}">
            <x-icon name="grip" class="absolute top-2 right-2 h-4 w-4 text-muted-foreground/30" />
            <h3 class="font-display text-2xl font-bold mb-1">{{ $table['id'] }}</h3>
            <div class="flex items-center gap-1 text-muted-foreground text-xs mb-3">
                <x-icon name="users" class="h-3 w-3" /> {{ $table['seats'] }}
            </div>

            @if($table['status'] === 'occupied')
            <div class="text-center">
                <div class="text-xs font-semibold text-accent">{{ $table['time'] }}</div>
                <div class="font-bold mt-1">{{ $table['bill'] }}</div>
            </div>
            @elseif($table['status'] === 'free')
            <div class="text-xs text-muted-foreground">Disponible</div>
            @else
            <div class="text-xs text-yellow-600 font-medium">Limpiando...</div>
            @endif
        </div>
        @endforeach
    </div>

</x-app-shell>
@endsection
