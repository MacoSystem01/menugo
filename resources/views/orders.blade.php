@extends('layouts.app')
@section('title', 'Pedidos en curso — MenuGo')

@section('content')
<x-app-shell variant="restaurant" title="Gestor de Pedidos (KDS)" subtitle="Monitor de cocina en tiempo real">

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">

        {{-- Nuevos --}}
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between border-b border-border pb-2">
                <h3 class="font-bold flex items-center gap-2">
                    <x-icon name="clock" class="h-4 w-4 text-accent" /> Nuevos
                </h3>
                <span class="bg-muted px-2 py-0.5 rounded-full text-xs font-bold">1</span>
            </div>
            <div class="bg-card border-l-4 border-l-accent border-y border-r border-border rounded-r-xl p-4 shadow-sm">
                <div class="flex justify-between items-center mb-3">
                    <span class="font-bold text-lg">#1285</span>
                    <span class="text-xs bg-accent/20 text-accent px-2 py-1 rounded font-semibold">2 min</span>
                </div>
                <div class="text-sm font-medium mb-2">Mesa 4</div>
                <ul class="text-sm space-y-1 mb-4 text-muted-foreground">
                    <li>• 2x Tacos al pastor</li>
                    <li>• 1x Coca Cola</li>
                </ul>
                <button class="w-full py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
                    A Cocinar
                </button>
            </div>
        </div>

        {{-- En Cocina --}}
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between border-b border-border pb-2">
                <h3 class="font-bold flex items-center gap-2">
                    <x-icon name="utensils" class="h-4 w-4 text-primary" /> En Cocina
                </h3>
                <span class="bg-muted px-2 py-0.5 rounded-full text-xs font-bold">1</span>
            </div>
            <div class="bg-card border-l-4 border-l-primary border-y border-r border-border rounded-r-xl p-4 shadow-sm">
                <div class="flex justify-between items-center mb-3">
                    <span class="font-bold text-lg">#1284</span>
                    <span class="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-semibold">8 min</span>
                </div>
                <div class="text-sm font-medium mb-2">Para llevar</div>
                <ul class="text-sm space-y-1 mb-4 text-muted-foreground">
                    <li>• 1x Burrito</li>
                    <li>• 1x Papas</li>
                </ul>
                <button class="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
                    Marcar Listo
                </button>
            </div>
        </div>

        {{-- Para Entregar --}}
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between border-b border-border pb-2">
                <h3 class="font-bold flex items-center gap-2">
                    <x-icon name="check" class="h-4 w-4 text-green-500" /> Para Entregar
                </h3>
                <span class="bg-muted px-2 py-0.5 rounded-full text-xs font-bold">1</span>
            </div>
            <div class="bg-card border-l-4 border-l-green-500 border-y border-r border-border rounded-r-xl p-4 shadow-sm opacity-80">
                <div class="flex justify-between items-center mb-3">
                    <span class="font-bold text-lg">#1283</span>
                    <span class="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded font-semibold">15 min</span>
                </div>
                <div class="text-sm font-medium mb-2">Mesa 12</div>
                <ul class="text-sm space-y-1 mb-4 text-muted-foreground">
                    <li>• 1x Nachos</li>
                    <li>• 2x Limonada</li>
                </ul>
                <button class="w-full mt-4 py-2 border border-green-500 text-green-500 hover:bg-green-500/10 rounded-lg text-sm font-bold transition-colors">
                    Entregado
                </button>
            </div>
        </div>

    </div>

</x-app-shell>
@endsection
