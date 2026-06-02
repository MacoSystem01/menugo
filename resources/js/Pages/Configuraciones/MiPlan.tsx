import AppShell from '@/Layouts/AppShell';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { useSupportWhatsapp } from '@/hooks/use-support-whatsapp';

const PLAN_ORDER = ['starter', 'basico', 'trimestral', 'semestral', 'anual'];

const PLAN_COLORS: Record<string, string> = {
    starter:    'border-emerald-500/30 bg-emerald-500/5 text-emerald-500',
    basico:     'border-zinc-500/30 bg-zinc-500/5 text-zinc-400',
    trimestral: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
    semestral:  'border-purple-500/30 bg-purple-500/5 text-purple-400',
    anual:      'border-amber-500/30 bg-amber-500/5 text-amber-400',
};

interface PlanFeature {
    name:     string;
    price:    string;
    period:   string;
    color:    string;
    includes: string[];
    excludes: string[];
}

interface Props extends PageProps {
    current_plan:    string;
    days_left:       number | null;
    expires_at:      string | null;
    payment_status:  string;
    features:        Record<string, PlanFeature>;
    current_feature: PlanFeature;
}

function StatusBadge({ daysLeft, paymentStatus }: { daysLeft: number | null; paymentStatus: string }) {
    if (paymentStatus === 'trial') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-500">
                🎁 En prueba{daysLeft !== null ? ` · ${daysLeft} día${daysLeft !== 1 ? 's' : ''}` : ''}
            </span>
        );
    }
    if (paymentStatus === 'overdue') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 border border-destructive/30 px-3 py-1 text-xs font-semibold text-destructive">
                <XCircle className="h-3.5 w-3.5" /> Vencido
            </span>
        );
    }
    if (paymentStatus === 'pending_payment' || paymentStatus === 'pending_review') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 text-xs font-semibold text-yellow-500">
                <Clock className="h-3.5 w-3.5" /> Pendiente de activación
            </span>
        );
    }
    if (daysLeft !== null && daysLeft <= 7) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-500">
                <AlertTriangle className="h-3.5 w-3.5" /> Vence en {daysLeft} día{daysLeft !== 1 ? 's' : ''}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-500">
            <CheckCircle2 className="h-3.5 w-3.5" /> Activo
        </span>
    );
}

export default function MiPlan({
    current_plan, days_left, expires_at, payment_status, features, current_feature,
}: Props) {
    const { url: waUrl } = useSupportWhatsapp();
    const currentIndex = PLAN_ORDER.indexOf(current_plan);

    const formatDate = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('es-CO', {
            day: '2-digit', month: 'long', year: 'numeric',
        });
    };

    return (
        <AppShell title="Mi Plan" subtitle="Gestiona tu suscripción a MenúGO">
            <Head title="Mi Plan" />

            <div className="max-w-4xl space-y-6">

                {/* ── Card plan actual ── */}
                <div className={`rounded-2xl border-2 p-6 ${PLAN_COLORS[current_plan] ?? PLAN_COLORS['starter']}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Plan actual</p>
                            <h2 className="font-display text-3xl font-bold">{current_feature.name}</h2>
                            <p className="text-lg font-semibold">
                                {current_feature.price}
                                <span className="text-sm font-normal opacity-70 ml-1">{current_feature.period}</span>
                            </p>
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-2">
                            <StatusBadge daysLeft={days_left} paymentStatus={payment_status} />
                            {expires_at && current_plan !== 'starter' && (
                                <p className="text-xs opacity-70">
                                    Vence el {formatDate(expires_at)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Features incluidos */}
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {current_feature.includes.map(f => (
                            <div key={f} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span>{f}</span>
                            </div>
                        ))}
                        {current_feature.excludes.map(f => (
                            <div key={f} className="flex items-center gap-2 text-sm opacity-40">
                                <XCircle className="h-4 w-4 shrink-0" />
                                <span>{f}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTAs según estado */}
                    <div className="mt-5 flex flex-wrap gap-3">
                        {payment_status === 'overdue' && (
                            <a
                                href={waUrl(`Hola, quiero renovar mi plan ${current_feature.name} de MenúGO`)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 transition"
                            >
                                🔄 Renovar ahora
                            </a>
                        )}
                        {payment_status === 'paid' && current_plan !== 'anual' && (
                            <a
                                href={waUrl(`Hola, quiero renovar mi plan ${current_feature.name} de MenúGO`)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl border border-current/30 bg-current/10 px-5 py-2.5 text-sm font-semibold hover:opacity-80 transition"
                            >
                                🔄 Renovar plan
                            </a>
                        )}
                        {payment_status === 'trial' && (
                            <a
                                href={waUrl(`Hola, quiero activar mi plan ${current_feature.name} de MenúGO`)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition"
                            >
                                🎁 Activar plan ahora
                            </a>
                        )}
                    </div>
                </div>

                {/* ── Planes disponibles para upgrade ── */}
                {currentIndex < PLAN_ORDER.length - 1 && (
                    <div>
                        <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                            Mejora tu plan
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {PLAN_ORDER.slice(currentIndex + 1).map(planKey => {
                                const feature = features[planKey];
                                if (!feature) return null;
                                const savings: Record<string, string> = {
                                    trimestral: 'Ahorras 20%',
                                    semestral:  'Ahorras 30%',
                                    anual:      'Ahorras 45%',
                                };
                                return (
                                    <div
                                        key={planKey}
                                        className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 hover:border-primary/40 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold text-foreground">{feature.name}</p>
                                                <p className="text-lg font-bold text-foreground mt-0.5">
                                                    {feature.price}
                                                    <span className="text-xs font-normal text-muted-foreground ml-1">
                                                        {feature.period}
                                                    </span>
                                                </p>
                                            </div>
                                            {savings[planKey] && (
                                                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-500">
                                                    {savings[planKey]}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-1.5 flex-1">
                                            {feature.includes.slice(0, 4).map(f => (
                                                <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                    <span>{f}</span>
                                                </div>
                                            ))}
                                            {feature.includes.length > 4 && (
                                                <p className="text-xs text-muted-foreground pl-5">
                                                    +{feature.includes.length - 4} más...
                                                </p>
                                            )}
                                        </div>

                                        <a
                                            href={waUrl(`Hola, quiero cambiar al plan ${feature.name} de MenúGO`)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground text-center hover:brightness-110 transition"
                                        >
                                            Cambiar a {feature.name} →
                                        </a>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Si ya tiene el plan máximo */}
                {current_plan === 'anual' && (
                    <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-2">
                        <div className="text-4xl">🏆</div>
                        <h3 className="font-semibold text-foreground">Tienes el mejor plan</h3>
                        <p className="text-sm text-muted-foreground">
                            El plan Escala incluye todas las funcionalidades de MenúGO.
                        </p>
                    </div>
                )}

                {/* Nota de soporte */}
                <p className="text-xs text-muted-foreground text-center pb-4">
                    ¿Tienes preguntas sobre tu plan?{' '}
                    <a
                        href={waUrl('Hola, tengo una pregunta sobre mi plan de MenúGO')}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                    >
                        Contáctanos por WhatsApp
                    </a>
                </p>
            </div>
        </AppShell>
    );
}
