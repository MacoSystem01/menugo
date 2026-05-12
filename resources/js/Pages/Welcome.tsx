import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    ArrowRight, Sparkles, Store, BarChart3, Truck, Utensils, ShieldCheck,
    Zap, Globe2, Star, Check, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─────────────────────────────────────────────
   Datos de planes compartidos entre modal y página
───────────────────────────────────────────── */
const plans = [
    {
        key: 'mensual',
        name: 'MENSUAL',
        emoji: '💰',
        price: '$30.000',
        period: '/mes',
        savings: null,
        popular: false,
    },
    {
        key: 'trimestral',
        name: 'TRIMESTRAL',
        emoji: '📦',
        price: '$80.000',
        period: '/3 meses',
        savings: 'Ahorras 11%',
        popular: false,
    },
    {
        key: 'semestral',
        name: 'SEMESTRAL',
        emoji: '⭐',
        price: '$220.000',
        period: '/6 meses',
        savings: 'Ahorras 39%',
        popular: true,
    },
    {
        key: 'anual',
        name: 'ANUAL',
        emoji: '🏆',
        price: '$350.000',
        period: '/año',
        savings: 'Ahorras 51%',
        popular: false,
    },
];

/* ─────────────────────────────────────────────
   Modal de planes (aparece al entrar a Welcome)
───────────────────────────────────────────── */
function PlansModal({ onClose }: { onClose: () => void }) {
    function selectPlan(planKey: string) {
        router.visit(`/register?plan=${planKey}`);
    }

    // Cerrar con Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'oklch(0 0 0 / 0.75)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="relative w-full max-w-3xl rounded-3xl border border-border overflow-hidden"
                style={{ background: 'oklch(0.14 0.018 50)' }}
            >
                {/* Botón cerrar */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                    style={{ background: 'oklch(0.20 0.02 50)' }}
                    aria-label="Cerrar"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="px-8 pt-10 pb-8 flex flex-col items-center text-center gap-4">

                    {/* Badge */}
                    <div
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
                        style={{
                            borderColor: 'oklch(0.85 0.18 110 / 0.4)',
                            background: 'oklch(0.85 0.18 110 / 0.08)',
                            color: 'oklch(0.85 0.18 110)',
                        }}
                    >
                        <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                        Oferta especial
                    </div>

                    {/* Título */}
                    <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
                        Lleva tu negocio al{' '}
                        <span className="text-gradient-warm">siguiente nivel</span>
                    </h2>

                    {/* Subtítulo */}
                    <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
                        Suscríbete a MenuGo y accede a todas las herramientas para
                        gestionar tu restaurante de forma digital.
                    </p>

                    {/* Grid de planes */}
                    <div className="w-full mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {plans.map((plan) => (
                            <div key={plan.key} className="relative flex flex-col">

                                {/* Badge "MÁS POPULAR" encima del card */}
                                {plan.popular ? (
                                    <div className="mb-1.5 flex justify-center">
                                        <span
                                            className="text-[10px] font-bold tracking-widest rounded-full px-3 py-1"
                                            style={{
                                                background: 'oklch(0.85 0.18 110)',
                                                color: 'oklch(0.18 0.02 50)',
                                            }}
                                        >
                                            MÁS POPULAR
                                        </span>
                                    </div>
                                ) : (
                                    /* Espacio reservado para alinear las cards */
                                    <div className="mb-1.5 h-[26px]" />
                                )}

                                {/* Tarjeta — clickeable */}
                                <button
                                    type="button"
                                    onClick={() => selectPlan(plan.key)}
                                    className="flex-1 flex flex-col items-center rounded-2xl p-4 gap-2 transition-all hover:scale-[1.03] hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-primary/60"
                                    style={{
                                        background: plan.popular
                                            ? 'oklch(0.18 0.03 120 / 0.35)'
                                            : 'oklch(0.19 0.02 50)',
                                        border: plan.popular
                                            ? '1.5px solid oklch(0.85 0.18 110 / 0.7)'
                                            : '1px solid oklch(0.30 0.02 55)',
                                    }}
                                >
                                    <span className="text-3xl" role="img" aria-label={plan.name}>
                                        {plan.emoji}
                                    </span>
                                    <span className="text-[11px] font-bold tracking-wider text-muted-foreground">
                                        {plan.name}
                                    </span>
                                    <div className="font-display text-2xl font-bold leading-none">
                                        {plan.price}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {plan.period}
                                    </span>
                                    {plan.savings && (
                                        <span
                                            className="text-[11px] font-semibold rounded-full px-2.5 py-0.5 mt-0.5"
                                            style={{
                                                background: 'oklch(0.85 0.18 110 / 0.15)',
                                                color: 'oklch(0.85 0.18 110)',
                                                border: '1px solid oklch(0.85 0.18 110 / 0.3)',
                                            }}
                                        >
                                            {plan.savings}
                                        </span>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <button
                        type="button"
                        onClick={() => selectPlan('semestral')}
                        className="mt-4 w-full max-w-xs"
                    >
                        <Button variant="hero" size="lg" className="w-full rounded-full text-base font-semibold group pointer-events-none">
                            Registrarme ahora
                            <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </button>

                    <p className="text-xs text-muted-foreground">
                        14 días de prueba gratis · Sin tarjeta de crédito
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Página principal Welcome
───────────────────────────────────────────── */
export default function Welcome() {
    const [showPlansModal, setShowPlansModal] = useState(true);

    return (
        <>
            <Head title="MenuGo — Sistema multi-restaurante todo en uno" />

            {/* Modal de planes al entrar */}
            {showPlansModal && (
                <PlansModal onClose={() => setShowPlansModal(false)} />
            )}

            <div className="min-h-screen">
                <SiteHeader onOpenPlans={() => setShowPlansModal(true)} />
                <Hero />
                <Marquee />
                <Features />
                <ForEveryone />
                <Testimonials />
                <CTA onOpenPlans={() => setShowPlansModal(true)} />
                <SiteFooter />
            </div>
        </>
    );
}

/* ─────────────────────────────────────────────
   Header — botón "Ver planes" abre el modal
───────────────────────────────────────────── */
function SiteHeader() {
    return (
        <header className="sticky top-0 z-40 glass">
            <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-8">

                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-warm opacity-40 blur-md rounded-full group-hover:opacity-70 transition-opacity" />
                        <div className="relative bg-white rounded-full p-2 shadow-glow transition-transform group-hover:scale-110">
                            <img src="/logo-trans.png" alt="MenuGo" className="h-20 w-auto" />
                        </div>
                    </div>
                    <span className="font-display text-3xl font-bold tracking-tight">
                        Menu<span className="text-gradient-warm">Go</span>
                    </span>
                </Link>

                {/* Menú más grande */}
                <nav className="hidden items-center gap-10 md:flex">
                    <a href="#features" className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors">Funciones</a>
                    <Link href="/pricing" className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors">Planes</Link>
                    <a href="#testimonios" className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors">Clientes</a>
                </nav>

                {/* Botones más grandes */}
                <div className="flex items-center gap-4">
                    <Link href="/login">
                        <Button variant="ghost" size="default" className="text-base">Iniciar sesión</Button>
                    </Link>
                    <Link href="/register">
                        <Button variant="hero" size="lg">Empezar gratis</Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}

/* ─────────────────────────────────────────────
   Secciones sin cambios
───────────────────────────────────────────── */
function Hero() {
    return (
        <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
            <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 lg:pt-32 lg:pb-32">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs">
                            <Sparkles className="h-3.5 w-3.5 text-accent" />
                            <span className="text-muted-foreground">Nuevo · Panel SuperAdmin global</span>
                        </div>
                        <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
                            Un sistema.<br />
                            <span className="text-gradient-warm">Todos tus locales.</span>
                        </h1>
                        <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                            Desde food trucks callejeros hasta restaurantes premium — MenuGo centraliza menús, pedidos, mesas, inventario y métricas en una sola plataforma multi-tenant.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Link href="/register">
                                <Button variant="hero" size="xl" className="group">
                                    Empezar gratis
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                            <Link href="/pricing">
                                <Button variant="outline" size="xl">Ver planes</Button>
                            </Link>
                        </div>
                        <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-accent" /> 14 días gratis</div>
                            <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-accent" /> Sin tarjeta</div>
                            <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-accent" /> Cancela cuando quieras</div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="relative animate-float">
                            <div className="absolute -inset-4 bg-gradient-warm opacity-30 blur-3xl rounded-[3rem]" />
                            <img
                                src="/images/hero-food.jpg"
                                alt="Variedad de platos de restaurantes"
                                className="relative rounded-3xl shadow-glow border border-border/50 object-cover aspect-4/3 w-full"
                            />
                        </div>
                        <div className="absolute -bottom-6 -left-6 glass rounded-2xl p-4 shadow-card">
                            <div className="text-xs text-muted-foreground">Pedidos hoy</div>
                            <div className="font-display text-2xl font-bold">1,284</div>
                            <div className="text-xs text-accent">↑ 23% vs ayer</div>
                        </div>
                        <div className="absolute -top-6 -right-6 glass rounded-2xl p-4 shadow-card">
                            <div className="text-xs text-muted-foreground">Locales activos</div>
                            <div className="font-display text-2xl font-bold">47</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Marquee() {
    const items = ['TacoLab', 'Sushi Nori', 'Burger Forge', 'Arepa Street', 'La Trattoria', 'Wok Express', 'El Asador'];
    return (
        <div className="border-y border-border bg-card/30 py-6 overflow-hidden">
            <div className="flex gap-12 text-muted-foreground items-center justify-around flex-wrap px-6">
                <span className="text-xs uppercase tracking-widest">Confían en MenuGo</span>
                {items.map(i => <span key={i} className="font-display text-lg font-semibold opacity-70">{i}</span>)}
            </div>
        </div>
    );
}

function Features() {
    const features = [
        { icon: Store, title: 'Multi-tenant nativo', desc: 'Cada restaurante con su propio perfil, branding, menú y equipo. Aislado y seguro.' },
        { icon: BarChart3, title: 'Panel SuperAdmin', desc: 'Métricas globales en tiempo real de todos los locales registrados en la plataforma.' },
        { icon: Utensils, title: 'Menús dinámicos', desc: 'Edita platos, precios y disponibilidad. Cambios en vivo sin reiniciar nada.' },
        { icon: Truck, title: 'Para puestos callejeros', desc: 'Diseñado también para food trucks y carritos. Móvil primero, súper liviano.' },
        { icon: ShieldCheck, title: 'Seguridad por diseño', desc: 'Roles, permisos y RLS. Tus datos y los de tus clientes siempre protegidos.' },
        { icon: Zap, title: 'Velocidad de chef', desc: 'Interfaz pulida para que el equipo se mueva tan rápido como tu cocina.' },
    ];
    return (
        <section id="features" className="mx-auto max-w-7xl px-6 py-24">
            <div className="max-w-2xl">
                <span className="text-sm font-semibold text-primary">FUNCIONES</span>
                <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold">Todo lo que tu operación necesita.</h2>
                <p className="mt-4 text-muted-foreground">Una sola plataforma para gestionar uno o cien locales sin perder el control.</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {features.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="group relative rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-glow">
                        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-warm">
                            <Icon className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function ForEveryone() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-24">
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 group">
                    <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl group-hover:bg-primary/30 transition-colors" />
                    <Utensils className="h-10 w-10 text-primary" />
                    <h3 className="mt-6 font-display text-3xl font-bold">Restaurantes organizados</h3>
                    <p className="mt-3 text-muted-foreground">Mesas, reservas, comandas, KDS, facturación. Lo que un restaurante moderno necesita para escalar.</p>
                    <ul className="mt-6 space-y-2 text-sm">
                        {['Gestión de mesas y reservas', 'Cocina conectada (KDS)', 'Reportes financieros'].map(i => (
                            <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" />{i}</li>
                        ))}
                    </ul>
                </div>
                <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 group">
                    <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-accent/20 blur-3xl group-hover:bg-accent/30 transition-colors" />
                    <Truck className="h-10 w-10 text-accent" />
                    <h3 className="mt-6 font-display text-3xl font-bold">Comida rápida callejera</h3>
                    <p className="mt-3 text-muted-foreground">Para puestos, carritos y food trucks. Cobra, gestiona y crece desde el celular.</p>
                    <ul className="mt-6 space-y-2 text-sm">
                        {['Pedido y cobro express', 'Modo offline', 'QR para tu menú digital'].map(i => (
                            <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" />{i}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}

function Testimonials() {
    const t = [
        { name: 'Camila Restrepo', role: 'Dueña, TacoLab', text: 'Pasé de un cuaderno a controlar 3 puestos desde mi celular. MenuGo cambió mi negocio.' },
        { name: 'Mateo Pérez', role: 'Gerente, La Trattoria', text: 'El panel SuperAdmin nos da visibilidad total. Sabemos qué local rinde más cada hora.' },
        { name: 'Lucía Gómez', role: 'Food truck Wok Express', text: 'Lo mejor: funciona offline. Nunca pierdo un pedido aunque se caiga el internet.' },
    ];
    return (
        <section id="testimonios" className="mx-auto max-w-7xl px-6 py-24">
            <div className="text-center max-w-2xl mx-auto">
                <span className="text-sm font-semibold text-primary">TESTIMONIOS</span>
                <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold">Restauranteros que ya cocinan distinto.</h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
                {t.map(({ name, role, text }) => (
                    <div key={name} className="rounded-2xl border border-border bg-card p-6">
                        <div className="flex gap-0.5 text-accent">
                            {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                        </div>
                        <p className="mt-4 text-sm leading-relaxed">"{text}"</p>
                        <div className="mt-6">
                            <div className="font-semibold text-sm">{name}</div>
                            <div className="text-xs text-muted-foreground">{role}</div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function CTA({ onOpenPlans }: { onOpenPlans: () => void }) {
    return (
        <section className="mx-auto max-w-7xl px-6 py-24">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-12 lg:p-20 text-center">
                <Globe2 className="absolute -top-10 -right-10 h-64 w-64 text-white/5" />
                <h2 className="font-display text-4xl sm:text-6xl font-bold text-primary-foreground">
                    Tu restaurante merece <br className="hidden sm:block" />moverse a la velocidad de hoy.
                </h2>
                <p className="mt-6 text-lg text-primary-foreground/80 max-w-xl mx-auto">
                    Empieza gratis en 60 segundos.
                </p>
                <div className="mt-8 flex flex-wrap gap-4 justify-center">
                    <Link href="/register">
                        <Button size="xl" className="bg-background text-foreground hover:bg-background/90">
                            Crear cuenta gratis <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    <button type="button" onClick={onOpenPlans}>
                        <Button size="xl" variant="ghost" className="text-primary-foreground hover:bg-white/10 pointer-events-none">
                            Ver planes
                        </Button>
                    </button>
                </div>
            </div>
        </section>
    );
}

function SiteFooter() {
    return (
        <footer className="border-t border-border mt-24">
            <div className="mx-auto max-w-7xl px-6 py-12 grid gap-8 md:grid-cols-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="bg-white rounded-full p-1.5 shadow">
                            <img src="/logo-trans.png" alt="MenuGo" className="h-6 w-auto" />
                        </div>
                        <span className="font-display text-lg font-bold">MenuGo</span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">El sistema operativo para restaurantes modernos y puestos de comida.</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-3">Producto</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>Funciones</li><li>Planes</li><li>Integraciones</li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-3">Recursos</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>Centro de ayuda</li><li>Comunidad</li><li>Blog</li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-3">Compañía</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>Sobre nosotros</li><li>Contacto</li><li>Términos</li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} MenuGo — Sistema de gestión de restaurantes.
            </div>
        </footer>
    );
}