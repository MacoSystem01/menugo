@extends('layouts.app')

@section('title', 'MenuGo — Sistema multi-restaurante todo en uno')
@section('description', 'La plataforma multi-tenant para restaurantes y puestos de comida callejera. Gestiona menús, pedidos, mesas y métricas desde un solo lugar.')

@section('content')
<div class="min-h-screen">
    <x-site-header />

    {{-- HERO --}}
    <section class="relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-radial pointer-events-none"></div>
        <div class="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl"></div>
        <div class="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl"></div>

        <div class="relative mx-auto max-w-7xl px-6 pt-20 pb-24 lg:pt-32 lg:pb-32">
            <div class="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                    <div class="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs">
                        <x-icon name="sparkles" class="h-3.5 w-3.5 text-accent" />
                        <span class="text-muted-foreground">Nuevo · Panel SuperAdmin global</span>
                    </div>
                    <h1 class="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
                        Un sistema.<br>
                        <span class="text-gradient-warm">Todos tus locales.</span>
                    </h1>
                    <p class="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                        Desde food trucks callejeros hasta restaurantes premium — MenuGo centraliza menús, pedidos, mesas, inventario y métricas en una sola plataforma multi-tenant.
                    </p>
                    <div class="mt-8 flex flex-wrap gap-4">
                        <a href="{{ url('/register') }}"
                           class="inline-flex items-center gap-2 rounded-xl bg-gradient-warm px-6 py-3 text-base font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
                            Empezar gratis
                            <x-icon name="arrow-right" class="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </a>
                        <a href="{{ url('/pricing') }}"
                           class="inline-flex items-center rounded-xl border border-border px-6 py-3 text-base font-semibold text-foreground hover:bg-muted/50 transition-colors">
                            Ver planes
                        </a>
                    </div>
                    <div class="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
                        <div class="flex items-center gap-1.5"><x-icon name="check" class="h-4 w-4 text-accent" /> 14 días gratis</div>
                        <div class="flex items-center gap-1.5"><x-icon name="check" class="h-4 w-4 text-accent" /> Sin tarjeta</div>
                        <div class="flex items-center gap-1.5"><x-icon name="check" class="h-4 w-4 text-accent" /> Cancela cuando quieras</div>
                    </div>
                </div>

                <div class="relative">
                    <div class="relative animate-float">
                        <div class="absolute -inset-4 bg-gradient-warm opacity-30 blur-3xl rounded-[3rem]"></div>
                        <img
                            src="{{ asset('images/hero-food.jpg') }}"
                            alt="Variedad de platos de restaurantes"
                            class="relative rounded-3xl shadow-glow border border-border/50 object-cover aspect-4/3 w-full"
                        />
                    </div>
                    <div class="absolute -bottom-6 -left-6 glass rounded-2xl p-4 shadow-card">
                        <div class="text-xs text-muted-foreground">Pedidos hoy</div>
                        <div class="font-display text-2xl font-bold">1,284</div>
                        <div class="text-xs text-accent">↑ 23% vs ayer</div>
                    </div>
                    <div class="absolute -top-6 -right-6 glass rounded-2xl p-4 shadow-card">
                        <div class="text-xs text-muted-foreground">Locales activos</div>
                        <div class="font-display text-2xl font-bold">47</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    {{-- MARQUEE --}}
    <div class="border-y border-border bg-card/30 py-6 overflow-hidden">
        <div class="flex gap-12 animate-pulse text-muted-foreground items-center justify-around flex-wrap px-6">
            <span class="text-xs uppercase tracking-widest">Confían en MenuGo</span>
            @foreach(['TacoLab','Sushi Nori','Burger Forge','Arepa Street','La Trattoria','Wok Express','El Asador'] as $brand)
                <span class="font-display text-lg font-semibold opacity-70">{{ $brand }}</span>
            @endforeach
        </div>
    </div>

    {{-- FEATURES --}}
    <section id="features" class="mx-auto max-w-7xl px-6 py-24">
        <div class="max-w-2xl">
            <span class="text-sm font-semibold text-primary">FUNCIONES</span>
            <h2 class="mt-2 font-display text-4xl sm:text-5xl font-bold">Todo lo que tu operación necesita.</h2>
            <p class="mt-4 text-muted-foreground">Una sola plataforma para gestionar uno o cien locales sin perder el control.</p>
        </div>
        <div class="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            @foreach([
                ['icon'=>'store',        'title'=>'Multi-tenant nativo',  'desc'=>'Cada restaurante con su propio perfil, branding, menú y equipo. Aislado y seguro.'],
                ['icon'=>'bar-chart-3',  'title'=>'Panel SuperAdmin',     'desc'=>'Métricas globales en tiempo real de todos los locales registrados en la plataforma.'],
                ['icon'=>'utensils',     'title'=>'Menús dinámicos',      'desc'=>'Edita platos, precios y disponibilidad. Cambios en vivo sin reiniciar nada.'],
                ['icon'=>'truck',        'title'=>'Para puestos callejeros','desc'=>'Diseñado también para food trucks y carritos. Móvil primero, súper liviano.'],
                ['icon'=>'shield-check', 'title'=>'Seguridad por diseño', 'desc'=>'Roles, permisos y RLS. Tus datos y los de tus clientes siempre protegidos.'],
                ['icon'=>'zap',          'title'=>'Velocidad de chef',    'desc'=>'Interfaz pulida para que el equipo se mueva tan rápido como tu cocina.'],
            ] as $f)
            <div class="group relative rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-glow">
                <div class="grid h-11 w-11 place-items-center rounded-xl bg-gradient-warm">
                    <x-icon :name="$f['icon']" class="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 class="mt-5 font-display text-xl font-semibold">{{ $f['title'] }}</h3>
                <p class="mt-2 text-sm text-muted-foreground leading-relaxed">{{ $f['desc'] }}</p>
            </div>
            @endforeach
        </div>
    </section>

    {{-- FOR EVERYONE --}}
    <section class="mx-auto max-w-7xl px-6 py-24">
        <div class="grid lg:grid-cols-2 gap-6">
            <div class="relative overflow-hidden rounded-3xl border border-border bg-card p-10 group">
                <div class="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl group-hover:bg-primary/30 transition-colors"></div>
                <x-icon name="utensils" class="h-10 w-10 text-primary" />
                <h3 class="mt-6 font-display text-3xl font-bold">Restaurantes organizados</h3>
                <p class="mt-3 text-muted-foreground">Mesas, reservas, comandas, KDS, facturación. Lo que un restaurante moderno necesita para escalar.</p>
                <ul class="mt-6 space-y-2 text-sm">
                    @foreach(['Gestión de mesas y reservas','Cocina conectada (KDS)','Reportes financieros'] as $item)
                    <li class="flex items-center gap-2"><x-icon name="check" class="h-4 w-4 text-accent" />{{ $item }}</li>
                    @endforeach
                </ul>
            </div>
            <div class="relative overflow-hidden rounded-3xl border border-border bg-card p-10 group">
                <div class="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-accent/20 blur-3xl group-hover:bg-accent/30 transition-colors"></div>
                <x-icon name="truck" class="h-10 w-10 text-accent" />
                <h3 class="mt-6 font-display text-3xl font-bold">Comida rápida callejera</h3>
                <p class="mt-3 text-muted-foreground">Para puestos, carritos y food trucks. Cobra, gestiona y crece desde el celular.</p>
                <ul class="mt-6 space-y-2 text-sm">
                    @foreach(['Pedido y cobro express','Modo offline','QR para tu menú digital'] as $item)
                    <li class="flex items-center gap-2"><x-icon name="check" class="h-4 w-4 text-accent" />{{ $item }}</li>
                    @endforeach
                </ul>
            </div>
        </div>
    </section>

    {{-- TESTIMONIALS --}}
    <section id="testimonios" class="mx-auto max-w-7xl px-6 py-24">
        <div class="text-center max-w-2xl mx-auto">
            <span class="text-sm font-semibold text-primary">TESTIMONIOS</span>
            <h2 class="mt-2 font-display text-4xl sm:text-5xl font-bold">Restauranteros que ya cocinan distinto.</h2>
        </div>
        <div class="mt-12 grid gap-6 md:grid-cols-3">
            @foreach([
                ['name'=>'Camila Restrepo','role'=>'Dueña, TacoLab',          'text'=>'Pasé de un cuaderno a controlar 3 puestos desde mi celular. MenuGo cambió mi negocio.'],
                ['name'=>'Mateo Pérez',    'role'=>'Gerente, La Trattoria',    'text'=>'El panel SuperAdmin nos da visibilidad total. Sabemos qué local rinde más cada hora.'],
                ['name'=>'Lucía Gómez',   'role'=>'Food truck Wok Express',   'text'=>'Lo mejor: funciona offline. Nunca pierdo un pedido aunque se caiga el internet.'],
            ] as $t)
            <div class="rounded-2xl border border-border bg-card p-6">
                <div class="flex gap-0.5 text-accent">
                    @for($i=0;$i<5;$i++)
                        <x-icon name="star" class="h-4 w-4 fill-current" />
                    @endfor
                </div>
                <p class="mt-4 text-sm leading-relaxed">"{{ $t['text'] }}"</p>
                <div class="mt-6">
                    <div class="font-semibold text-sm">{{ $t['name'] }}</div>
                    <div class="text-xs text-muted-foreground">{{ $t['role'] }}</div>
                </div>
            </div>
            @endforeach
        </div>
    </section>

    {{-- CTA --}}
    <section class="mx-auto max-w-7xl px-6 py-24">
        <div class="relative overflow-hidden rounded-3xl bg-gradient-hero p-12 lg:p-20 text-center">
            <x-icon name="globe-2" class="absolute -top-10 -right-10 h-64 w-64 text-white/5" />
            <h2 class="font-display text-4xl sm:text-6xl font-bold text-primary-foreground">
                Tu restaurante merece <br class="hidden sm:block">moverse a la velocidad de hoy.
            </h2>
            <p class="mt-6 text-lg text-primary-foreground/80 max-w-xl mx-auto">
                Empieza gratis en 60 segundos. Sin tarjeta, sin compromiso.
            </p>
            <div class="mt-8 flex flex-wrap gap-4 justify-center">
                <a href="{{ url('/register') }}"
                   class="inline-flex items-center gap-2 rounded-xl bg-background text-foreground px-6 py-3 text-base font-semibold hover:bg-background/90 transition-colors">
                    Crear cuenta gratis <x-icon name="arrow-right" class="h-4 w-4" />
                </a>
                <a href="{{ url('/pricing') }}"
                   class="inline-flex items-center rounded-xl px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-white/10 transition-colors">
                    Ver planes
                </a>
            </div>
        </div>
    </section>

    <x-site-footer />
</div>
@endsection
