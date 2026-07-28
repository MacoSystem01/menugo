import { Head, Link, router } from '@inertiajs/react';
import { Check, X, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginSearch } from '@/components/LoginSearch';

const plans = [
    {
        key: 'basico',
        name: '1 mes',
        price: '$20.000',
        period: 'COP / mes',
        desc: 'Pago mes a mes. Sin ataduras.',
        badge: null,
        features: ['Menú ilimitado', 'QR ilimitados', 'Pedidos desde mesa', 'Notif. WhatsApp', 'KDS cocina', 'Soporte por chat'],
        locked: ['Analytics avanzado', 'Delivery propio'],
        cta: 'Elegir 1 mes',
        variant: 'outline' as const,
        popular: false,
        savings: null,
    },
    {
        key: 'trimestral',
        name: '3 meses',
        price: '$50.000',
        period: 'COP / 3 meses',
        desc: 'Estabiliza tu operación con más ahorro.',
        badge: 'Ahorras 17%',
        features: ['Todo lo de 1 mes', 'Analytics de ventas', 'Reportes avanzados', 'Horas pico', 'Soporte por chat'],
        locked: ['Delivery propio'],
        cta: 'Elegir 3 meses',
        variant: 'outline' as const,
        popular: false,
        savings: 'Ahorras 17%',
    },
    {
        key: 'semestral',
        name: '6 meses',
        price: '$110.000',
        period: 'COP / 6 meses',
        desc: 'La opción más equilibrada.',
        badge: 'Ahorras 8%',
        features: ['Todo lo de 3 meses', 'Soporte prioritario', 'Asesoría inicial', 'Acceso anticipado a nuevas funciones'],
        locked: ['Delivery propio'],
        cta: 'Elegir 6 meses',
        variant: 'outline' as const,
        popular: false,
        savings: 'Ahorras 8%',
    },
    {
        key: 'anual',
        name: '12 meses',
        price: '$200.000',
        period: 'COP / año',
        desc: 'Máxima rentabilidad. Delivery sin comisión.',
        badge: 'Mejor precio',
        features: ['Todo lo de 6 meses', 'Delivery propio', 'Sin comisión', 'Página del restaurante', 'Integración WhatsApp delivery', 'Soporte dedicado'],
        locked: [],
        cta: 'Elegir 12 meses',
        variant: 'hero' as const,
        popular: true,
        savings: 'Mejor precio',
    },
];

function selectPlan(planKey: string) {
    router.visit(`/register?plan=${planKey}`);
}

export default function Pricing() {
    return (
        <>
            <Head title="Planes y precios — Menugo" />
            <div className="min-h-screen">

                {/* Header */}
                <header className="sticky top-0 z-50 glass">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="bg-white rounded-full p-1.5 shadow transition-transform group-hover:scale-110">
                                <img src="/logo-trans.png" alt="Menugo" className="h-7 w-auto" />
                            </div>
                            <span className="font-display text-xl font-bold tracking-tight">
                                Menu<span className="text-gradient-warm">Go</span>
                            </span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <LoginSearch triggerClass="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" />
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
                    <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Acceso completo a todas las funciones. Sin comisiones ocultas.</p>

                    <div className="mt-16 grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 text-left">
                        {plans.map(p => (
                            <div key={p.key}
                                className={`relative flex flex-col rounded-3xl border p-5 ${p.popular ? 'border-primary bg-card shadow-glow scale-[1.02]' : 'border-border bg-card hover:border-primary/50 transition-colors'}`}>
                                {p.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-warm px-3 py-1 text-xs font-semibold text-primary-foreground whitespace-nowrap">
                                        MÁS POPULAR
                                    </div>
                                )}
                                <h3 className="font-display text-xl font-bold">{p.name}</h3>
                                <div className="mt-3 flex items-baseline gap-1">
                                    <span className="font-display text-3xl font-bold tracking-tight">{p.price}</span>
                                </div>
                                <span className="text-xs font-medium text-muted-foreground mt-0.5">{p.period}</span>

                                {p.badge && (
                                    <div className="mt-2">
                                        <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent border border-accent/20">
                                            {p.badge}
                                        </span>
                                    </div>
                                )}

                                <p className="mt-3 text-xs text-muted-foreground leading-relaxed grow">{p.desc}</p>

                                {/* ── Redirecciona a /register?plan=KEY ── */}
                                <Button
                                    variant={p.variant}
                                    size="sm"
                                    className="mt-5 w-full group"
                                    onClick={() => selectPlan(p.key)}
                                >
                                    {p.cta}
                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                </Button>
                                {p.key !== 'starter' && (
                                    <p className="text-[10px] text-center text-muted-foreground mt-1.5">
                                        🎁 15 días de cortesia - Gratis!
                                    </p>
                                )}

                                <ul className="mt-5 space-y-2">
                                    {p.features.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-xs text-foreground/90">
                                            <Check className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" /> {f}
                                        </li>
                                    ))}
                                    {p.locked.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground/50 line-through">
                                            <X className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Menugo — Sistema de gestión de restaurantes.
                </footer>
            </div>
        </>
    );
}
