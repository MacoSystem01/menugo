import { Head, Link, router } from '@inertiajs/react';
import { Check, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const plans = [
    {
        key: 'starter',
        name: 'Starter',
        price: 'Gratis',
        period: 'para siempre',
        desc: 'Perfecto para puestos callejeros que están empezando.',
        features: ['1 local', 'Hasta 50 productos', 'Menú QR', 'Pedidos básicos', 'Soporte por email'],
        cta: 'Empezar gratis',
        variant: 'outline' as const,
    },
    {
        key: 'pro',
        name: 'Pro',
        price: '$29',
        period: '/mes por local',
        desc: 'Para restaurantes que crecen y necesitan más control.',
        features: ['Locales ilimitados', 'Productos ilimitados', 'KDS de cocina', 'Reservas y mesas', 'Reportes avanzados', 'Inventario', 'Soporte prioritario'],
        cta: 'Probar 14 días',
        variant: 'hero' as const,
        popular: true,
    },
    {
        key: 'enterprise',
        name: 'Enterprise',
        price: 'A medida',
        period: '',
        desc: 'Para cadenas y franquicias con necesidades específicas.',
        features: ['Todo en Pro', 'Panel SuperAdmin global', 'API y webhooks', 'Integraciones a medida', 'SLA dedicado', 'Onboarding 1:1'],
        cta: 'Contactar ventas',
        variant: 'outline' as const,
    },
];

function selectPlan(planKey: string) {
    router.visit(`/register?plan=${planKey}`);
}

export default function Pricing() {
    return (
        <>
            <Head title="Planes y precios — MenuGo" />
            <div className="min-h-screen">

                {/* Header */}
                <header className="sticky top-0 z-50 glass">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="bg-white rounded-full p-1.5 shadow transition-transform group-hover:scale-110">
                                <img src="/logo-trans.png" alt="MenuGo" className="h-7 w-auto" />
                            </div>
                            <span className="font-display text-xl font-bold tracking-tight">
                                Menu<span className="text-gradient-warm">Go</span>
                            </span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">Iniciar sesión</Button>
                            </Link>
                            <Link href="/register">
                                <Button variant="hero" size="sm">Empezar gratis</Button>
                            </Link>
                        </div>
                    </div>
                </header>

                <section className="mx-auto max-w-7xl px-6 py-20 text-center">

                    {/* ── Botón volver al inicio ── */}
                    <div className="flex justify-start mb-8">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-4 w-4" />
                                Volver al inicio
                            </Button>
                        </Link>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs">
                        <Sparkles className="h-3.5 w-3.5 text-accent" /> Precios transparentes
                    </div>
                    <h1 className="mt-6 font-display text-5xl sm:text-6xl font-bold">
                        Elige tu plan.<br /><span className="text-gradient-warm">Crece sin límites.</span>
                    </h1>
                    <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Sin contratos. Sin sorpresas. Cancela cuando quieras.</p>

                    <div className="mt-16 grid gap-6 md:grid-cols-3 text-left">
                        {plans.map(p => (
                            <div key={p.name}
                                className={`relative rounded-3xl border p-8 ${p.popular ? 'border-primary bg-card shadow-glow' : 'border-border bg-card'}`}>
                                {p.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-warm px-3 py-1 text-xs font-semibold text-primary-foreground">
                                        Más popular
                                    </div>
                                )}
                                <h3 className="font-display text-2xl font-bold">{p.name}</h3>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="font-display text-5xl font-bold">{p.price}</span>
                                    <span className="text-sm text-muted-foreground">{p.period}</span>
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">{p.desc}</p>

                                {/* ── Redirecciona a /register?plan=KEY ── */}
                                <button
                                    type="button"
                                    onClick={() => selectPlan(p.key)}
                                    className="mt-6 w-full"
                                >
                                    <Button variant={p.variant} size="lg" className="w-full pointer-events-none group">
                                        {p.cta}
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </button>

                                <ul className="mt-8 space-y-3">
                                    {p.features.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-sm">
                                            <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" /> {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
                    © {new Date().getFullYear()} MenuGo — Sistema de gestión de restaurantes.
                </footer>
            </div>
        </>
    );
}