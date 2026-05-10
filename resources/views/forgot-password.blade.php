@extends('layouts.app')
@section('title', 'Recuperar contraseña — MenuGo')

@section('content')
<div class="min-h-screen flex items-center justify-center bg-white px-6">

    <div class="w-full max-w-md">

        {{-- Logo --}}
        <a href="{{ url('/') }}" class="flex justify-center mb-10">
            <div class="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
                <img src="{{ asset('logo-trans.png') }}" alt="MenuGo" class="h-16 w-auto" />
            </div>
        </a>

        {{-- Card --}}
        <div class="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">

            {{-- Ícono decorativo --}}
            <div class="flex justify-center mb-6">
                <div class="grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 border border-orange-100">
                    <x-icon name="shield-check" class="h-8 w-8 text-orange-500" />
                </div>
            </div>

            <h1 class="font-display text-2xl font-bold text-gray-900 text-center">¿Olvidaste tu contraseña?</h1>
            <p class="mt-2 text-sm text-gray-500 text-center leading-relaxed">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <form class="mt-8 space-y-4" method="POST" action="{{ url('/forgot-password') }}">
                @csrf

                <div class="space-y-1.5">
                    <label for="email" class="text-sm font-semibold text-gray-700">Email</label>
                    <input id="email" name="email" type="email" placeholder="tu@restaurante.com" autocomplete="email"
                           class="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder:text-gray-400
                                  focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-all shadow-sm" />
                </div>

                <button type="submit"
                        class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-warm px-6 py-3.5 text-base font-semibold text-white shadow-glow hover:opacity-90 transition-opacity">
                    Enviar enlace de recuperación
                    <x-icon name="arrow-right" class="h-4 w-4" />
                </button>
            </form>

            <div class="mt-6 text-center">
                <a href="{{ url('/login') }}"
                   class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 font-medium transition-colors">
                    <x-icon name="arrow-right" class="h-3.5 w-3.5 rotate-180" />
                    Volver al inicio de sesión
                </a>
            </div>
        </div>
    </div>
</div>
@endsection
