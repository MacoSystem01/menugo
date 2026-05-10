<footer class="border-t border-border mt-24">
    <div class="mx-auto max-w-7xl px-6 py-12 grid gap-8 md:grid-cols-4">
        <div>
            <div class="flex items-center">
                <img src="{{ asset('logo-trans.png') }}" alt="MenuGo" class="h-9 w-auto" />
            </div>
            <p class="mt-3 text-sm text-muted-foreground">El sistema operativo para restaurantes modernos y puestos de comida.</p>
        </div>
        <div>
            <h4 class="font-semibold mb-3">Producto</h4>
            <ul class="space-y-2 text-sm text-muted-foreground">
                <li><a href="{{ url('/#features') }}" class="hover:text-foreground transition-colors">Funciones</a></li>
                <li><a href="{{ url('/pricing') }}" class="hover:text-foreground transition-colors">Planes</a></li>
                <li><span>Integraciones</span></li>
            </ul>
        </div>
        <div>
            <h4 class="font-semibold mb-3">Recursos</h4>
            <ul class="space-y-2 text-sm text-muted-foreground">
                <li><span>Centro de ayuda</span></li>
                <li><span>Comunidad</span></li>
                <li><span>Blog</span></li>
            </ul>
        </div>
        <div>
            <h4 class="font-semibold mb-3">Compañía</h4>
            <ul class="space-y-2 text-sm text-muted-foreground">
                <li><span>Sobre nosotros</span></li>
                <li><span>Contacto</span></li>
                <li><span>Términos</span></li>
            </ul>
        </div>
    </div>
    <div class="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {{ date('Y') }} MenuGo. Hecho con fuego para restauranteros.
    </div>
</footer>
