import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ArrowRight, Check, Utensils, Zap } from 'lucide-react';

type EstablishmentType = 'restaurante' | 'puesto' | '';

const TYPES = [
    {
        key: 'restaurante' as const,
        icon: Utensils,
        label: 'Restaurante',
        desc: 'Mesas, comandas, cocina, reportes y más',
    },
    {
        key: 'puesto' as const,
        icon: Zap,
        label: 'Puesto de Comida Rápida',
        desc: 'Ágil, móvil y sin complicaciones',
    },
];

const BENEFITS = [
    '14 días de plan PRO gratis',
    'Migración asistida sin costo',
    'Soporte por WhatsApp',
    'Cancela cuando quieras',
];

export default function Register() {
    const plan = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('plan')
        : null;

    const { data, setData, post, processing, errors } = useForm({
        name:                  '',
        type:                  '' as EstablishmentType,
        email:                 '',
        password:              '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/register');
    };

    const namePlaceholder = data.type === 'restaurante'
        ? 'Ej: La Trattoria'
        : data.type === 'puesto'
        ? 'Ej: Tacos El Compa'
        : 'Nombre de tu establecimiento';

    return (
        <>
            <Head title="Crear cuenta — MenuGo" />
            <div className="min-h-screen grid lg:grid-cols-2">

                {/* ── Panel izquierdo: formulario ── */}
                <div className="flex items-start justify-center bg-background px-8 py-12 order-2 lg:order-1 overflow-y-auto">
                    <div className="w-full max-w-sm space-y-7">

                        {/* Logo mobile */}
                        <div className="flex lg:hidden justify-center">
                            <div className="bg-white rounded-full p-2 shadow-md">
                                <img src="/logo-trans.png" alt="MenuGo" className="h-12 w-auto" />
                            </div>
                        </div>

                        {/* Encabezado */}
                        <div>
                            <h1 className="font-display text-2xl font-bold text-foreground">
                                Crea tu cuenta
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Empieza gratis. Sin tarjeta de crédito.
                            </p>
                        </div>

                        {/* Badge de plan (si viene de pricing) */}
                        {plan && (
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                Plan <span className="font-bold capitalize">{plan}</span> seleccionado
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">

                            {/* ── Selector de tipo ── */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Tipo de establecimiento
                                    <span className="ml-1 text-destructive">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {TYPES.map(({ key, icon: Icon, label, desc }) => {
                                        const selected = data.type === key;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setData('type', key)}
                                                className={[
                                                    'flex flex-col items-center text-center gap-2 rounded-2xl border p-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50',
                                                    selected
                                                        ? 'border-primary bg-primary/10 shadow-glow'
                                                        : 'border-border bg-card hover:border-primary/40 hover:bg-card/80',
                                                ].join(' ')}
                                            >
                                                <div className={[
                                                    'grid h-10 w-10 place-items-center rounded-xl transition-colors',
                                                    selected
                                                        ? 'bg-gradient-warm text-primary-foreground'
                                                        : 'bg-muted text-muted-foreground',
                                                ].join(' ')}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-semibold leading-tight ${selected ? 'text-primary' : 'text-foreground'}`}>
                                                        {label}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                                                        {desc}
                                                    </p>
                                                </div>
                                                {selected && (
                                                    <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary">
                                                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.type && (
                                    <p className="text-xs text-destructive">{errors.type}</p>
                                )}
                            </div>

                            {/* Nombre del establecimiento */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">
                                    {data.type === 'restaurante'
                                        ? 'Nombre del restaurante'
                                        : data.type === 'puesto'
                                        ? 'Nombre del puesto'
                                        : 'Nombre del establecimiento'}
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder={namePlaceholder}
                                    className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm
                                               text-foreground placeholder:text-muted-foreground
                                               focus:outline-none focus:ring-2 focus:ring-primary/60 transition"
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Correo electrónico</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    placeholder="tu@restaurante.com"
                                    autoComplete="email"
                                    className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm
                                               text-foreground placeholder:text-muted-foreground
                                               focus:outline-none focus:ring-2 focus:ring-primary/60 transition"
                                />
                                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                            </div>

                            {/* Contraseña */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Contraseña</label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    placeholder="Mínimo 8 caracteres"
                                    autoComplete="new-password"
                                    className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm
                                               text-foreground placeholder:text-muted-foreground
                                               focus:outline-none focus:ring-2 focus:ring-primary/60 transition"
                                />
                                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                            </div>

                            {/* Confirmar contraseña */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Confirmar contraseña</label>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={e => setData('password_confirmation', e.target.value)}
                                    placeholder="Repite tu contraseña"
                                    autoComplete="new-password"
                                    className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm
                                               text-foreground placeholder:text-muted-foreground
                                               focus:outline-none focus:ring-2 focus:ring-primary/60 transition"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing || !data.type}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-warm py-2.5
                                           text-sm font-semibold text-primary-foreground shadow-glow
                                           hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {processing ? 'Creando cuenta…' : 'Crear cuenta'}
                                {!processing && <ArrowRight className="h-4 w-4" />}
                            </button>
                        </form>

                        <p className="text-center text-sm text-muted-foreground">
                            ¿Ya tienes cuenta?{' '}
                            <Link href="/login" className="text-primary font-medium hover:underline">
                                Inicia sesión
                            </Link>
                        </p>
                    </div>
                </div>

                {/* ── Panel derecho: promo ── */}
                <div className="hidden lg:flex relative bg-gradient-hero overflow-hidden order-1 lg:order-2 p-12 flex-col justify-between">
                    <div className="absolute inset-0 bg-gradient-radial opacity-40 pointer-events-none" />
                    <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

                    {/* Logo */}
                    <div className="relative flex items-center gap-3">
                        <div className="bg-white rounded-full p-2 shadow-md">
                            <img src="/logo-trans.png" alt="MenuGo" className="h-10 w-auto" />
                        </div>
                        <span className="font-display text-xl font-bold text-primary-foreground">MenuGo</span>
                    </div>

                    {/* Contenido central */}
                    <div className="relative space-y-6">
                        <h2 className="font-display text-4xl font-bold text-primary-foreground leading-tight">
                            Únete a +500 restaurantes que ya operan con MenuGo.
                        </h2>
                        <ul className="space-y-3">
                            {BENEFITS.map(b => (
                                <li key={b} className="flex items-center gap-3 text-primary-foreground">
                                    <div className="grid h-6 w-6 place-items-center rounded-full bg-white/20 shrink-0">
                                        <Check className="h-3.5 w-3.5" />
                                    </div>
                                    {b}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Tarjeta de estadística */}
                    <div className="relative glass rounded-2xl p-6">
                        <div className="text-3xl font-display font-bold text-primary-foreground">+47%</div>
                        <div className="text-sm text-primary-foreground/80 mt-1">
                            Aumento promedio en ventas el primer trimestre.
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}
