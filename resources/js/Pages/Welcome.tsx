import { Head, Link } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="Bienvenido" />
            <div className="min-h-screen flex flex-col bg-background">

                {/* Nav */}
                <header className="flex items-center justify-between px-8 py-5 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="bg-white rounded-full p-1.5 shadow">
                            <img src="/logo-trans.png" alt="MenuGo" className="h-8 w-auto" />
                        </div>
                        <span className="font-display font-bold text-foreground text-lg">MenuGo</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition">Precios</Link>
                        <Link href="/login" className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card transition">
                            Iniciar sesión
                        </Link>
                        <Link href="/register" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition">
                            Empezar gratis
                        </Link>
                    </div>
                </header>

                {/* Hero */}
                <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 gap-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
                        🍽️ Sistema de gestión para restaurantes
                    </div>
                    <h1 className="font-display text-5xl lg:text-6xl font-bold max-w-3xl leading-tight text-foreground">
                        Todo tu restaurante en un solo lugar
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-xl">
                        Pedidos por QR, cocina en tiempo real, caja, domicilios e inventario — todo conectado desde una plataforma unificada.
                    </p>
                    <div className="flex items-center gap-4">
                        <Link href="/register" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:brightness-110 transition">
                            Comenzar ahora →
                        </Link>
                        <Link href="/pricing" className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-card transition">
                            Ver precios
                        </Link>
                    </div>

                    {/* Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 w-full max-w-3xl">
                        {[
                            { icon: '📱', label: 'Pedidos QR', desc: 'Sin contacto, sin errores' },
                            { icon: '🍳', label: 'Cocina en vivo', desc: 'Tickets en tiempo real' },
                            { icon: '👥', label: 'Multi-rol', desc: '6 perfiles de acceso' },
                            { icon: '📊', label: 'Reportes', desc: 'Por hora y por día' },
                        ].map(f => (
                            <div key={f.label} className="rounded-2xl border border-border bg-card p-5 text-left">
                                <span className="text-2xl">{f.icon}</span>
                                <p className="mt-2 font-semibold text-sm text-foreground">{f.label}</p>
                                <p className="text-xs text-muted-foreground">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </main>

                <footer className="border-t border-border px-8 py-5 text-center text-xs text-muted-foreground">
                    © {new Date().getFullYear()} MenuGo — Sistema de gestión de restaurantes
                </footer>
            </div>
        </>
    );
}
