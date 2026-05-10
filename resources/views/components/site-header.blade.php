<header class="sticky top-0 z-50 glass">
    <div class="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
        <a href="{{ url('/') }}" class="flex items-center group">
            <div class="flex items-center justify-center bg-white rounded-full p-2 shadow-md transition-transform group-hover:scale-105">
                <img src="{{ asset('logo-trans.png') }}" alt="MenuGo" class="h-20 w-auto" />
            </div>
        </a>
        <nav class="hidden items-center gap-8 md:flex">
            <a href="{{ url('/#features') }}" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Funciones</a>
            <a href="{{ url('/pricing') }}" class="text-sm text-muted-foreground hover:text-foreground transition-colors {{ request()->is('pricing') ? 'text-foreground' : '' }}">Planes</a>
            <a href="{{ url('/#testimonios') }}" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Clientes</a>
        </nav>
        <div class="flex items-center gap-3">
            <a href="{{ url('/login') }}" class="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                Iniciar sesión
            </a>
            <a href="{{ url('/register') }}" class="inline-flex items-center gap-2 rounded-xl bg-gradient-warm px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
                Empezar gratis
            </a>
        </div>
    </div>
</header>
