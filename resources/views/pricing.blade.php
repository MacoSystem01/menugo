@extends('layouts.app')
@section('title', 'Planes y precios — MenuGo')
@section('description', 'Elige el plan que mejor se adapta a tu restaurante o puesto. Empieza gratis.')

@section('content')
<div class="min-h-screen">
    <x-site-header />

    <section class="mx-auto max-w-7xl px-6 py-20 text-center">
        <div class="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs">
            <x-icon name="sparkles" class="h-3.5 w-3.5 text-accent" /> Precios transparentes
        </div>
        <h1 class="mt-6 font-display text-5xl sm:text-6xl font-bold">
            Elige tu plan.<br><span class="text-gradient-warm">Crece sin límites.</span>
        </h1>
        <p class="mt-4 text-muted-foreground max-w-xl mx-auto">Sin contratos. Sin sorpresas. Cancela cuando quieras.</p>

        <div class="mt-16 grid gap-6 md:grid-cols-3 text-left">
            @php
            $plans = [
                [
                    'name'     => 'Starter',
                    'price'    => 'Gratis',
                    'period'   => 'para siempre',
                    'desc'     => 'Perfecto para puestos callejeros que están empezando.',
                    'features' => ['1 local','Hasta 50 productos','Menú QR','Pedidos básicos','Soporte por email'],
                    'cta'      => 'Empezar gratis',
                    'popular'  => false,
                ],
                [
                    'name'     => 'Pro',
                    'price'    => '$29',
                    'period'   => '/mes por local',
                    'desc'     => 'Para restaurantes que crecen y necesitan más control.',
                    'features' => ['Locales ilimitados','Productos ilimitados','KDS de cocina','Reservas y mesas','Reportes avanzados','Inventario','Soporte prioritario'],
                    'cta'      => 'Probar 14 días',
                    'popular'  => true,
                ],
                [
                    'name'     => 'Enterprise',
                    'price'    => 'A medida',
                    'period'   => '',
                    'desc'     => 'Para cadenas y franquicias con necesidades específicas.',
                    'features' => ['Todo en Pro','Panel SuperAdmin global','API y webhooks','Integraciones a medida','SLA dedicado','Onboarding 1:1'],
                    'cta'      => 'Contactar ventas',
                    'popular'  => false,
                ],
            ];
            @endphp

            @foreach($plans as $plan)
            <div class="relative rounded-3xl border p-8 {{ $plan['popular'] ? 'border-primary bg-card shadow-glow' : 'border-border bg-card' }}">
                @if($plan['popular'])
                <div class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-warm px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Más popular
                </div>
                @endif
                <h3 class="font-display text-2xl font-bold">{{ $plan['name'] }}</h3>
                <div class="mt-4 flex items-baseline gap-1">
                    <span class="font-display text-5xl font-bold">{{ $plan['price'] }}</span>
                    @if($plan['period'])
                        <span class="text-sm text-muted-foreground">{{ $plan['period'] }}</span>
                    @endif
                </div>
                <p class="mt-3 text-sm text-muted-foreground">{{ $plan['desc'] }}</p>
                <a href="{{ url('/register') }}"
                   class="mt-6 flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all
                          {{ $plan['popular']
                              ? 'bg-gradient-warm text-primary-foreground shadow-glow hover:opacity-90'
                              : 'border border-border text-foreground hover:bg-muted/50' }}">
                    {{ $plan['cta'] }}
                </a>
                <ul class="mt-8 space-y-3">
                    @foreach($plan['features'] as $feature)
                    <li class="flex items-start gap-2 text-sm">
                        <x-icon name="check" class="h-4 w-4 text-accent shrink-0 mt-0.5" /> {{ $feature }}
                    </li>
                    @endforeach
                </ul>
            </div>
            @endforeach
        </div>
    </section>

    <x-site-footer />
</div>
@endsection
