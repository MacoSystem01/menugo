@extends('layouts.app')
@section('title', 'Acceso SuperAdmin — MenuGo')

@section('content')
<div class="min-h-screen flex items-center justify-center bg-gray-950 px-6 relative overflow-hidden">

    {{-- Fondo decorativo oscuro con acento naranja --}}
    <div class="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl pointer-events-none"></div>

    <div class="w-full max-w-sm relative z-10">

        {{-- Logo --}}
        <a href="{{ url('/') }}" class="flex justify-center mb-8">
            <div class="bg-white rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                <img src="{{ asset('logo-trans.png') }}" alt="MenuGo" class="h-14 w-auto" />
            </div>
        </a>

        {{-- Badge SuperAdmin --}}
        <div class="flex justify-center mb-6">
            <div class="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold text-orange-400">
                <x-icon name="shield-check" class="h-3.5 w-3.5" />
                Zona de acceso restringido
            </div>
        </div>

        {{-- Card --}}
        <div class="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">

            <h1 class="font-display text-2xl font-bold text-white text-center">Panel SuperAdmin</h1>
            <p class="mt-2 text-sm text-gray-400 text-center">Solo para administradores autorizados</p>

            <form class="mt-8 space-y-5" method="POST" action="{{ url('/admin/login') }}">
                @csrf

                <div class="space-y-1.5">
                    <label for="email" class="text-sm font-semibold text-gray-300">Email de administrador</label>
                    <input id="email" name="email" type="email" placeholder="admin@menugo.com" autocomplete="email"
                           class="flex h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-sm text-white placeholder:text-gray-500
                                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white/15 transition-all" />
                </div>

                <div class="space-y-1.5">
                    <label for="password" class="text-sm font-semibold text-gray-300">Contraseña</label>
                    <input id="password" name="password" type="password" placeholder="••••••••" autocomplete="current-password"
                           class="flex h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-sm text-white placeholder:text-gray-500
                                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white/15 transition-all" />
                </div>

                <a href="{{ url('/admin') }}"
                   class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-warm px-6 py-3.5 text-base font-semibold text-white shadow-glow hover:opacity-90 transition-opacity">
                    Acceder al panel global
                    <x-icon name="arrow-right" class="h-4 w-4" />
                </a>
            </form>

            <div class="mt-6 pt-6 border-t border-white/10 text-center">
                <a href="{{ url('/login') }}"
                   class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-400 font-medium transition-colors">
                    <x-icon name="arrow-right" class="h-3.5 w-3.5 rotate-180" />
                    Volver al login de restaurante
                </a>
            </div>
        </div>

        <p class="mt-6 text-center text-xs text-gray-600">
            Acceso monitoreado · MenuGo © {{ date('Y') }}
        </p>
    </div>
</div>
@endsection
