@extends('layouts.app')
@section('title', 'Iniciar sesión — MenuGo')

@section('content')
<div class="min-h-screen flex">

    {{-- ══ Panel izquierdo: branding ══ --}}
    <div class="hidden lg:flex w-1/2 relative flex-col items-center justify-between bg-gradient-hero overflow-hidden py-16 px-12">
        <div class="absolute inset-0 bg-gradient-radial opacity-60 pointer-events-none"></div>
        <div class="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
        <div class="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>

        {{-- Logo --}}
        <div class="relative z-10 flex flex-col items-center gap-6 flex-1 justify-center">
            <div class="bg-white rounded-3xl p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                <img src="{{ asset('logo-trans.png') }}" alt="MenuGo" class="w-56 h-auto" />
            </div>
            <p class="text-primary-foreground/80 text-lg font-medium tracking-wide text-center max-w-xs">
                El sistema operativo para restaurantes modernos
            </p>
            <div class="flex gap-6 mt-4">
                <div class="glass rounded-2xl px-5 py-3 text-center">
                    <div class="font-display text-2xl font-bold text-primary-foreground">+500</div>
                    <div class="text-xs text-primary-foreground/70 mt-0.5">Restaurantes</div>
                </div>
                <div class="glass rounded-2xl px-5 py-3 text-center">
                    <div class="font-display text-2xl font-bold text-primary-foreground">32K</div>
                    <div class="text-xs text-primary-foreground/70 mt-0.5">Pedidos / día</div>
                </div>
                <div class="glass rounded-2xl px-5 py-3 text-center">
                    <div class="font-display text-2xl font-bold text-primary-foreground">99%</div>
                    <div class="text-xs text-primary-foreground/70 mt-0.5">Satisfacción</div>
                </div>
            </div>
        </div>
    </div>

    {{-- ══ Panel derecho: formulario (fondo blanco) ══ --}}
    <div class="flex flex-1 flex-col items-center justify-center px-8 py-16 bg-white">

        {{-- Logo solo en móvil --}}
        <a href="{{ url('/') }}" class="lg:hidden flex flex-col items-center mb-10">
            <div class="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 mb-3">
                <img src="{{ asset('logo-trans.png') }}" alt="MenuGo" class="h-20 w-auto" />
            </div>
        </a>

        <div class="w-full max-w-sm">

            {{-- Encabezado --}}
            <div class="mb-8 text-center lg:text-left">
                <h1 class="font-display text-3xl font-bold text-gray-900">Bienvenido de vuelta</h1>
                <p class="mt-2 text-gray-500 text-sm">Inicia sesión para acceder a tu panel</p>
            </div>

            {{-- Formulario --}}
            <form class="space-y-5" method="POST" action="{{ url('/login') }}">
                @csrf

                <div class="space-y-1.5">
                    <label for="email" class="text-sm font-semibold text-gray-700">Email</label>
                    <input id="email" name="email" type="email" placeholder="tu@restaurante.com" autocomplete="email"
                           class="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder:text-gray-400
                                  focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-all shadow-sm" />
                </div>

                <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                        <label for="password" class="text-sm font-semibold text-gray-700">Contraseña</label>
                        <a href="{{ url('/forgot-password') }}" class="text-xs font-medium text-orange-500 hover:text-orange-600 hover:underline transition-colors">
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>
                    <input id="password" name="password" type="password" placeholder="••••••••" autocomplete="current-password"
                           class="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder:text-gray-400
                                  focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-all shadow-sm" />
                </div>

                <a href="{{ url('/dashboard') }}"
                   class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-warm px-6 py-3.5 text-base font-semibold text-white shadow-glow hover:opacity-90 transition-opacity mt-2">
                    Entrar al panel
                    <x-icon name="arrow-right" class="h-4 w-4" />
                </a>
            </form>

            {{-- Separador --}}
            <div class="my-6 flex items-center gap-3">
                <div class="flex-1 h-px bg-gray-200"></div>
                <span class="text-xs text-gray-400 font-medium">¿Nuevo aquí?</span>
                <div class="flex-1 h-px bg-gray-200"></div>
            </div>

            <a href="{{ url('/register') }}"
               class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all">
                Crear cuenta gratis
            </a>

            {{-- Acceso SuperAdmin --}}
            <div class="mt-8 p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <p class="text-xs text-gray-500 mb-2">¿Eres administrador?</p>
                <a href="{{ url('/admin/login') }}"
                   class="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-orange-600 transition-colors">
                    <x-icon name="shield-check" class="h-3.5 w-3.5" />
                    Acceso SuperAdmin
                    <x-icon name="arrow-right" class="h-3 w-3" />
                </a>
            </div>
        </div>
    </div>

</div>
@endsection
