import { Head, Link, router } from '@inertiajs/react';
import { Check, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginSearch } from '@/components/LoginSearch';

const plans = [
    {
        key: 'mensual',
        name: 'Mensual',
        price: '$30.000',
        period: 'COP / mes',
        desc: 'Pago mes a mes, sin ataduras.',
        features: ['Locales ilimitados', 'Productos ilimitados', 'Menú QR', 'Pedidos y mesas', 'KDS de cocina', 'Inventario y reportes', 'Soporte estándar'],
        cta: 'Elegir Mensual',
        variant: 'outline' as const,
        popular: false,
        savings: null,
    },
    {
        key: 'trimestral',
        name: 'Trimestral',
        price: '$80.000',
        period: 'COP / 3 meses',
        desc: 'Ideal para estabilizar la operación.',
        features: ['Todo lo del mensual', 'Ahorro del 11%', 'Soporte prioritario'],
        cta: 'Elegir Trimestral',
        variant: 'outline' as const,
        popular: false,
        savings: 'Ahorras 11%',
    },
    {
        key: 'semestral',
        name: 'Semestral',
        price: '$220.000',
        period: 'COP / 6 meses',
        desc: 'Nuestra opción más equilibrada y popular.',
        features: ['Todo lo del mensual', 'Ahorro del 39%', 'Soporte prioritario', 'Asesoría inicial'],
        cta: 'Elegir Semestral',
        variant: 'hero' as const,
        popular: true,
        savings: 'Ahorras 39%',
    },
    {
        key: 'anual',
        name: 'Anual',
        price: '$350.000',
        period: 'COP / año',
        desc: 'Maximiza tu rentabilidad todo el año.',
        features: ['Todo lo del mensual', 'Ahorro del 51%', 'Soporte VIP 24/7', 'Asesoría 1:1', 'Nuevas funciones anticipadas'],
        cta: 'Elegir Anual',
        variant: 'outline' as const,
        popular: false,
        savings: 'Ahorras 51%',
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

                    <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4 text-left">
                        {plans.map(p => (
                            <div key={p.name}
                                className={`relative flex flex-col rounded-3xl border p-8 ${p.popular ? 'border-primary bg-card shadow-glow scale-[1.02]' : 'border-border bg-card hover:border-primary/50 transition-colors'}`}>
                                {p.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-warm px-3 py-1 text-xs font-semibold text-primary-foreground">
                                        Más popular
                                    </div>
                                )}
                                <h3 className="font-display text-2xl font-bold">{p.name}</h3>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="font-display text-4xl font-bold tracking-tight">{p.price}</span>
                                </div>
                                <span className="text-sm font-medium text-muted-foreground mt-1">{p.period}</span>
                                
                                {p.savings && (
                                    <div className="mt-2">
                                        <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent border border-accent/20">
                                            {p.savings}
                                        </span>
                                    </div>
                                )}
                                
                                <p className="mt-4 text-sm text-muted-foreground leading-relaxed flex-grow">{p.desc}</p>

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
                                        <li key={f} className="flex items-start gap-2 text-sm text-foreground/90">
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