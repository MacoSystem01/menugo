import AppShell from '@/Layouts/AppShell';
// SystemAlertBanner ahora está en AppShell (variant="admin") — aparece en TODAS las páginas admin
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Building2, TrendingUp, Globe2, ShieldCheck, ShieldAlert, CreditCard,
    Bell, Clock, Upload, CheckCircle2, User, ChevronRight, X,
} from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface TenantRow {
    id:         string;
    name:       string;
    type:       string;
    plan:       string;
    active:     boolean;
    subdomain:  string | null;
    created_at: string;
}

interface PendingPayment {
    id:             string;
    name:           string;
    owner_name:     string | null;
    email:          string;
    plan:           string;
    payment_status: string;
    has_evidence:   boolean;
    subdomain:      string | null;
    created_at:     string;
}

interface Props {
    stats: {
        total:     number;
        activos:   number;
        inactivos: number;
        por_tipo:  Record<string, number>;
        por_plan:  Record<string, number>;
    };
    lista:           TenantRow[];
    crecimiento:     { month: string; count: number }[];
    pendingPayments: PendingPayment[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<string, string> = {
    restaurante: 'Restaurante',
    puesto:      'Puesto / Food truck',
};

const PLAN_CLASS: Record<string, string> = {
    anual:       'bg-accent/20 text-accent',
    semestral:   'bg-primary/20 text-primary',
    trimestral:  'bg-primary/15 text-primary',
    mensual:     'bg-muted text-muted-foreground',
};

const PLAN_LABELS: Record<string, string> = {
    mensual: 'Mensual', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual',
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function AdminDashboard({ stats, lista, crecimiento, pendingPayments }: Props) {
    const [activatingId,    setActivatingId]    = useState<string | null>(null);
    const [dismissedIds,    setDismissedIds]    = useState<string[]>([]);

    const visiblePending = pendingPayments.filter(p => !dismissedIds.includes(p.id));

    const currentMonth = new Date().toISOString().slice(0, 7);
    const prevMonth    = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
    const thisCount    = crecimiento.find(c => c.month === currentMonth)?.count ?? 0;
    const prevCount    = crecimiento.find(c => c.month === prevMonth)?.count ?? 0;
    const growthLabel  = thisCount > 0
        ? `+${thisCount} este mes`
        : prevCount > 0
            ? `0 este mes`
            : 'Sin datos';

    function activateTenant(id: string) {
        setActivatingId(id);
        router.patch(`/admin/tenants/${id}/activate`, {}, { onFinish: () => setActivatingId(null) });
    }

    const kpis = [
        { label: 'Locales registrados', value: String(stats.total),     icon: Building2,  color: 'text-primary'    },
        { label: 'Locales activos',     value: String(stats.activos),   icon: ShieldCheck, color: 'text-green-500' },
        { label: 'Locales inactivos',   value: String(stats.inactivos), icon: ShieldAlert, color: 'text-red-500'   },
        { label: 'Pagos pendientes',    value: String(pendingPayments.length), icon: CreditCard, color: pendingPayments.length > 0 ? 'text-amber-500' : 'text-muted-foreground' },
    ];

    return (
        <AppShell variant="admin" title="Dashboard Global" subtitle="Gestión centralizada de la plataforma Menugo">
            <Head title="SuperAdmin - Dashboard" />

            {/* ── Alerta de pagos pendientes ──────────────────────────────── */}
            {visiblePending.length > 0 && (
                <div className="mb-8 space-y-3">
                    {/* Encabezado de la sección */}
                    <div className="flex items-center gap-2.5">
                        <div className="relative">
                            <Bell className="h-5 w-5 text-amber-500" />
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white">
                                {visiblePending.length}
                            </span>
                        </div>
                        <h2 className="font-display text-base font-bold text-foreground">
                            Nuevos pagos pendientes de confirmación
                        </h2>
                    </div>

                    {/* Tarjetas de alerta */}
                    {visiblePending.map(p => (
                        <div
                            key={p.id}
                            className={`relative rounded-2xl border px-5 py-4 ${
                                p.has_evidence
                                    ? 'border-amber-500/35 bg-amber-500/8'
                                    : 'border-border bg-card'
                            }`}
                        >
                            {/* Botón cerrar (ocultar de la vista sin activar) */}
                            <button
                                type="button"
                                onClick={() => setDismissedIds(ids => [...ids, p.id])}
                                className="absolute top-3 right-3 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title="Ocultar esta alerta"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pr-6">
                                {/* Info del registro */}
                                <div className="flex-1 min-w-0 space-y-2">
                                    {/* Nombre del negocio + badge */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-sm text-foreground">{p.name}</p>
                                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                            p.has_evidence
                                                ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                                                : 'bg-muted text-muted-foreground border border-border'
                                        }`}>
                                            {p.has_evidence
                                                ? <><Upload className="h-2.5 w-2.5" /> Con comprobante</>
                                                : <><Clock className="h-2.5 w-2.5" /> Sin comprobante</>
                                            }
                                        </span>
                                    </div>

                                    {/* Titular del pago */}
                                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span>
                                            <span className="text-muted-foreground">A nombre de: </span>
                                            <strong>{p.owner_name ?? p.email}</strong>
                                        </span>
                                    </div>

                                    {/* Detalles */}
                                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                                        <span>{p.email}</span>
                                        <span>·</span>
                                        <span>Plan <strong className="text-foreground">{PLAN_LABELS[p.plan] ?? p.plan}</strong></span>
                                        <span>·</span>
                                        <span>{p.subdomain}</span>
                                        <span>·</span>
                                        <span>Registrado: {p.created_at}</span>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <Link
                                        href="/admin/billing"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                                    >
                                        Ver en Facturación <ChevronRight className="h-3 w-3" />
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => activateTenant(p.id)}
                                        disabled={activatingId === p.id}
                                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-bold hover:bg-accent/90 transition-colors disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        {activatingId === p.id ? 'Activando…' : 'Confirmar y activar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── KPIs ─────────────────────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpis.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:shadow-primary/5">
                        <div className="flex justify-between items-start">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
                            <div className={`grid h-9 w-9 place-items-center rounded-xl bg-muted/50 ${color} group-hover:scale-110 transition-transform`}>
                                <Icon className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 font-display text-3xl font-bold">{value}</div>
                        <div className="mt-2 flex items-center text-[10px] text-muted-foreground">
                            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                            <span>{growthLabel}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
                {/* Tabla de locales recientes */}
                <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                    <div className="p-5 flex justify-between items-center border-b border-border bg-muted/10">
                        <div>
                            <h2 className="font-display text-base font-bold">Registros recientes</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Control de acceso y planes</p>
                        </div>
                        <Link href="/admin/tenants" className="text-xs font-semibold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                            Ver todos los locales
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted/30">
                                <tr>
                                    <th className="text-left px-6 py-4 font-bold">Local / Tipo</th>
                                    <th className="text-left px-6 py-4 font-bold">Estado</th>
                                    <th className="text-left px-6 py-4 font-bold">Plan</th>
                                    <th className="text-right px-6 py-4 font-bold">Registro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {lista.map(t => (
                                    <tr key={t.id} className="group hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-hero text-white font-display font-bold shadow-sm">
                                                    {t.name[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{t.name}</div>
                                                    <div className="text-[11px] text-muted-foreground">{TIPO_LABEL[t.type] ?? t.type}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${t.active ? 'bg-green-500/15 text-green-600' : 'bg-red-500/15 text-red-600'}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${t.active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                {t.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter ${PLAN_CLASS[t.plan] ?? 'bg-muted text-muted-foreground'}`}>
                                                {PLAN_LABELS[t.plan] ?? t.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-[11px] font-mono text-muted-foreground">
                                            {t.created_at}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                            <Globe2 className="h-4 w-4 text-primary" />
                            <h2 className="font-display text-base font-bold text-foreground">Distribución de Negocio</h2>
                        </div>
                        <div className="space-y-5">
                            <StatProgress label="Restaurantes" value={stats.por_tipo.restaurante ?? 0} total={stats.total} color="bg-primary" />
                            <StatProgress label="Puestos / Food Trucks" value={stats.por_tipo.puesto ?? 0} total={stats.total} color="bg-accent" />
                            <div className="pt-4 border-t border-border">
                                <StatProgress label="Plan Anual"      value={stats.por_plan.anual ?? 0}      total={stats.total} color="bg-accent" />
                                <StatProgress label="Plan Semestral"  value={stats.por_plan.semestral ?? 0}  total={stats.total} color="bg-primary" />
                                <StatProgress label="Plan Trimestral" value={stats.por_plan.trimestral ?? 0} total={stats.total} color="bg-blue-500" />
                                <StatProgress label="Plan Mensual"    value={stats.por_plan.mensual ?? 0}    total={stats.total} color="bg-muted-foreground" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-zinc-900 p-6 text-white shadow-xl shadow-zinc-200 dark:shadow-none">
                        <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
                        <div className="absolute top-4 right-4 text-primary/40"><TrendingUp className="h-12 w-12" /></div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Suscripciones Activas</div>
                        <div className="font-display text-4xl font-bold mt-2">{stats.activos}</div>
                        <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-400">
                            <span>Pendientes de activar</span>
                            <span className={`font-mono text-sm font-bold ${pendingPayments.length > 0 ? 'text-amber-400' : 'text-white'}`}>
                                {pendingPayments.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

function StatProgress({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
    const percent = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="mb-4 last:mb-0">
            <div className="flex justify-between text-[11px] mb-1.5 uppercase tracking-wide font-semibold">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground">{value} <span className="text-[9px] opacity-40">({Math.round(percent)}%)</span></span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full transition-all duration-700 ${color}`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}
