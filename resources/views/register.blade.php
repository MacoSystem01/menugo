@extends('layouts.app')
@section('title', 'Regístrate gratis — MenuGo')

@section('content')
<div class="min-h-screen grid lg:grid-cols-2">
    {{-- Panel del formulario --}}
    <div class="flex items-center justify-center p-8 order-2 lg:order-1">
        <div class="w-full max-w-md">
            <a href="{{ url('/') }}" class="flex items-center mb-8">
                <img src="{{ asset('logo-trans.png') }}" alt="MenuGo" class="h-10 w-auto" />
            </a>
            <h1 class="font-display text-3xl font-bold">Crea tu restaurante</h1>
            <p class="mt-2 text-muted-foreground">Empieza gratis. Sin tarjeta.</p>

            <form class="mt-8 space-y-4" method="POST" action="{{ url('/register') }}">
                @csrf
                <div class="space-y-2">
                    <label for="biz" class="text-sm font-medium text-foreground">Nombre del local</label>
                    <input id="biz" name="business_name" placeholder="Tacos El Compa"
                           class="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-2">
                        <label for="name" class="text-sm font-medium text-foreground">Tu nombre</label>
                        <input id="name" name="name" placeholder="Camila"
                               class="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <div class="space-y-2">
                        <label for="type" class="text-sm font-medium text-foreground">Tipo</label>
                        <select id="type" name="type"
                                class="flex h-10 w-full rounded-md border border-input bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                            <option>Restaurante</option>
                            <option>Food truck</option>
                            <option>Puesto callejero</option>
                            <option>Bar / Cafetería</option>
                        </select>
                    </div>
                </div>
                <div class="space-y-2">
                    <label for="email" class="text-sm font-medium text-foreground">Email</label>
                    <input id="email" name="email" type="email" placeholder="tu@restaurante.com"
                           class="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div class="space-y-2">
                    <label for="password" class="text-sm font-medium text-foreground">Contraseña</label>
                    <input id="password" name="password" type="password" placeholder="Mínimo 8 caracteres"
                           class="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <a href="{{ url('/dashboard') }}"
                   class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-warm px-6 py-3 text-base font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
                    Crear cuenta <x-icon name="arrow-right" class="h-4 w-4" />
                </a>
            </form>

            <div class="mt-6 text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta? <a href="{{ url('/login') }}" class="text-primary font-medium hover:underline">Inicia sesión</a>
            </div>
        </div>
    </div>

    {{-- Panel decorativo --}}
    <div class="hidden lg:flex relative bg-gradient-hero overflow-hidden order-1 lg:order-2 p-12 flex-col justify-between">
        <div class="absolute inset-0 bg-gradient-radial opacity-40"></div>
        <div class="relative">
            <h2 class="font-display text-4xl font-bold text-primary-foreground leading-tight">Únete a +500 restaurantes que ya operan con MenuGo.</h2>
            <ul class="mt-8 space-y-3">
                @foreach(['14 días de plan PRO gratis','Migración asistida sin costo','Soporte por WhatsApp','Cancela cuando quieras'] as $item)
                <li class="flex items-center gap-3 text-primary-foreground">
                    <div class="grid h-6 w-6 place-items-center rounded-full bg-background/20">
                        <x-icon name="check" class="h-3.5 w-3.5" />
                    </div>
                    {{ $item }}
                </li>
                @endforeach
            </ul>
        </div>
        <div class="relative glass rounded-2xl p-6">
            <div class="text-3xl font-display font-bold text-primary-foreground">+47%</div>
            <div class="text-sm text-primary-foreground/80 mt-1">Aumento promedio en ventas el primer trimestre.</div>
        </div>
    </div>
</div>
@endsection
