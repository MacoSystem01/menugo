@extends('layouts.app')
@section('title', 'Menu Digital — MenuGo')

@section('content')
<x-app-shell variant="restaurant" title="Menu Digital" subtitle="Gestión de categorías y productos para el cliente">

    <div class="flex justify-between items-center mb-6">
        <div class="relative">
            <x-icon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Buscar producto..."
                   class="pl-9 h-10 w-64 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
            <x-icon name="plus" class="h-4 w-4" /> Nuevo Producto
        </button>
    </div>

    <div class="flex gap-6">
        {{-- Sidebar de categorías --}}
        <div class="w-48 shrink-0 space-y-1">
            <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-3">Categorías</h3>
            @foreach(['Más vendidos','Tacos','Burritos','Bebidas','Postres'] as $i => $cat)
            <button class="w-full text-left px-3 py-2 text-sm rounded-md transition-colors
                           {{ $i === 0 ? 'bg-accent/15 text-accent font-medium' : 'hover:bg-muted text-muted-foreground' }}">
                {{ $cat }}
            </button>
            @endforeach
            <button class="w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-md font-medium mt-2 flex items-center gap-2">
                <x-icon name="plus" class="h-3 w-3" /> Nueva
            </button>
        </div>

        {{-- Grid de productos --}}
        <div class="flex-1 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            @foreach([
                ['name'=>'Tacos al Pastor',   'category'=>'Tacos',         'price'=>'$4.50',  'status'=>'Activo'],
                ['name'=>'Burrito Mixto',     'category'=>'Burritos',      'price'=>'$8.00',  'status'=>'Activo'],
                ['name'=>'Nachos Especiales', 'category'=>'Más vendidos',  'price'=>'$12.00', 'status'=>'Agotado'],
            ] as $product)
            <div class="border border-border rounded-xl p-4 bg-card hover:border-primary/30 transition-colors">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{{ $product['category'] }}</span>
                    <button class="text-muted-foreground hover:text-foreground">
                        <x-icon name="more-vertical" class="h-4 w-4" />
                    </button>
                </div>
                <h4 class="font-bold mb-1">{{ $product['name'] }}</h4>
                <div class="flex justify-between items-center mt-3">
                    <span class="font-semibold text-accent">{{ $product['price'] }}</span>
                    <span class="text-xs px-2 py-1 rounded-md
                                 {{ $product['status'] === 'Activo' ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive' }}">
                        {{ $product['status'] }}
                    </span>
                </div>
            </div>
            @endforeach
        </div>
    </div>

</x-app-shell>
@endsection
