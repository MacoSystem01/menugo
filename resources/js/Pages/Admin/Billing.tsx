import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    CreditCard, CheckCircle2, Clock, Zap, Crown, Building,
    Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Save,
    Eye, Check, Ban, History, ChevronLeft, ChevronRight,
    Image, Store,
} from 'lucide-react';
import AdRequestTable, { type AdRequest } from '@/components/AdRequestTable';

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface PaymentMethod {
    id: number;
    name: string;
    account_info: string;
    instructions: string | null;
    active: boolean;
    sort_order: number;
}

interface PendingTenant {
    id: string;
    name: string;
    email: string;
    plan: string;
    payment_status: string;
    deleted_at: string | null;
    payment_evidence_path: string | null;
    subdomain: string;
    created_at: string;
}

interface TenantHistoryItem {
    id: string;
    name: string;
    email: string;
    plan: string;
    payment_status: string;
    subdomain: string | null;
    created_at: string;
    deleted_at: string | null;
}

interface Props {
    stats: {
        por_plan: Record<string, number>;
        total_revenue: number;
        total_monthly: number;
    };
    pendingTenants: PendingTenant[];
    paymentMethods: PaymentMethod[];
    adRequestsBanner: AdRequest[];
    adRequestsSlider: AdRequest[];
    tenantHistory: {
        activas: TenantHistoryItem[];
        inactivas: TenantHistoryItem[];
        eliminadas: TenantHistoryItem[];
    };
    flash?: { success?: string };
}

const PLAN_PRICES: Record<string, number> = {
    starter: 0,
    basico: 34900,
    trimestral: 83900,
    semestral: 146900,
    anual: 230900,
    mensual: 34900,
};

const PLAN_LABELS: Record<string, string> = {
    starter: 'Starter',
    basico: 'Básico',
    trimestral: 'Trimestral',
    semestral: 'Pro',
    anual: 'Escala',
    mensual: 'Mensual (legacy)',
};

const PER_PAGE = 5;

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

// ── Paginación genérica ────────────────────────────────────────────────────────

function usePager<T>(items: T[]) {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));

    // Evitar página huérfana si la lista encoge (fix anti-patrón render)
    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const slice = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    return { page, setPage, totalPages, slice };
}

// ── Paginación UI reutilizable ──────────────────────────────────────────────────

function Pager({ page, totalPages, setPage, total }: {
    page: number; totalPages: number; setPage: (p: number) => void; total: number;
}) {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
                Página {page} de {totalPages} · {total} registros
            </p>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`min-w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${p === page
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

// ── Modal de método de pago ────────────────────────────────────────────────────

interface MethodModalProps {
    method: PaymentMethod | null;
    onClose: () => void;
}

function MethodModal({ method, onClose }: MethodModalProps) {
    const [form, setForm] = useState({
        name: method?.name ?? '',
        account_info: method?.account_info ?? '',
        instructions: method?.instructions ?? '',
    });
    const [saving, setSaving] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        if (method) {
            router.put(`/admin/payment-methods/${method.id}`, form, {
                onSuccess: () => onClose(),
                onFinish: () => setSaving(false),
            });
        } else {
            router.post('/admin/payment-methods', form, {
                onSuccess: () => onClose(),
                onFinish: () => setSaving(false),
            });
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
                    <h2 className="text-base font-bold text-foreground">
                        {method ? 'Editar método de pago' : 'Nuevo método de pago'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                            Nombre del método
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Ej: Nequi, Bancolombia, Daviplata"
                            required
                            className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                            Información de la cuenta
                        </label>
                        <input
                            type="text"
                            value={form.account_info}
                            onChange={e => setForm(f => ({ ...f, account_info: e.target.value }))}
                            placeholder="Ej: 3001234567 · Carlos Rodríguez"
                            required
                            className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                            Instrucciones <span className="font-normal text-muted-foreground/60">(opcional)</span>
                        </label>
                        <textarea
                            rows={3}
                            value={form.instructions}
                            onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                            placeholder="Ej: Envía el comprobante al WhatsApp +57 300..."
                            className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-border">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                            <Save className="h-4 w-4" />
                            {saving ? 'Guardando…' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

type HistoryTab = 'activas' | 'inactivas' | 'eliminadas';

export default function Billing({
    stats, pendingTenants, paymentMethods,
    adRequestsBanner, adRequestsSlider,
    tenantHistory, flash,
}: Props) {
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null | false>(false);
    const [activatingId, setActivatingId] = useState<string | null>(null);
    const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
    const [historyTab, setHistoryTab] = useState<HistoryTab>('activas');
    const [historyPages, setHistoryPages] = useState<Record<HistoryTab, number>>({
        activas: 1, inactivas: 1, eliminadas: 1,
    });

    // Paginadores para cada sección de pendientes
    const tenantPager = usePager(pendingTenants);

    // Corregir página del historial si la lista encoge tras una acción (p.ej. activar tenant)
    useEffect(() => {
        const tabs: HistoryTab[] = ['activas', 'inactivas', 'eliminadas'];
        setHistoryPages(prev => {
            const updated = { ...prev };
            let changed = false;
            tabs.forEach(tab => {
                const total = Math.max(1, Math.ceil(tenantHistory[tab].length / PER_PAGE));
                if (prev[tab] > total) { updated[tab] = total; changed = true; }
            });
            return changed ? updated : prev;
        });
    }, [tenantHistory]);

    const plans = [
        { key: 'starter', name: 'Starter', icon: Zap, color: 'text-emerald-500' },
        { key: 'basico', name: 'Básico', icon: Clock, color: 'text-zinc-500' },
        { key: 'trimestral', name: 'Trimestral', icon: Building, color: 'text-blue-500' },
        { key: 'semestral', name: 'Pro', icon: CreditCard, color: 'text-purple-500' },
        { key: 'anual', name: 'Escala', icon: Crown, color: 'text-amber-500' },
    ];

    function toggleMethod(id: number) {
        router.patch(`/admin/payment-methods/${id}/toggle`);
    }

    function deleteMethod(id: number, name: string) {
        if (!confirm(`¿Eliminar el método de pago "${name}"?`)) return;
        router.delete(`/admin/payment-methods/${id}`);
    }

    function activateTenant(id: string) {
        setActivatingId(id);
        router.patch(`/admin/tenants/${id}/activate`, {}, { onFinish: () => setActivatingId(null) });
    }

    return (
        <AppShell title="Suscripciones y Facturación" subtitle="Control de ingresos, métodos de pago y activaciones" variant="admin">
            <Head title="SuperAdmin - Facturación" />

            {/* Modal de método de pago */}
            {editingMethod !== false && (
                <MethodModal method={editingMethod} onClose={() => setEditingMethod(false)} />
            )}

            {/* Modal de evidencia de pago */}
            {evidencePreview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setEvidencePreview(null)}
                >
                    <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setEvidencePreview(null)}
                            className="absolute -top-4 -right-4 p-2 rounded-full bg-card text-foreground hover:bg-muted"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        {evidencePreview.toLowerCase().endsWith('.pdf')
                            ? <iframe src={evidencePreview} className="w-full h-[80vh] rounded-2xl" />
                            : <img src={evidencePreview} alt="Comprobante" className="w-full rounded-2xl object-contain max-h-[80vh]" />
                        }
                    </div>
                </div>
            )}

            {/* Flash */}
            {flash?.success && (
                <div className="mb-6 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
                    {flash.success}
                </div>
            )}

            {/* ── Estadísticas de planes ─────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                {plans.map(p => (
                    <div key={p.key} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{p.name}</p>
                            <p.icon className={`h-4 w-4 ${p.color}`} />
                        </div>
                        <p className="text-2xl font-display font-bold text-foreground">{stats.por_plan[p.key] ?? 0}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {fmt((stats.por_plan[p.key] ?? 0) * PLAN_PRICES[p.key])} / mes
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 mb-10">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Ingresos Totales (pagos reales)</p>
                    <p className="text-3xl font-display font-bold text-foreground">{fmt(stats.total_revenue)}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                        Equiv. mensual:{' '}
                        <span className="font-semibold text-foreground">{fmt(stats.total_monthly)}</span>
                        <span className="ml-1 opacity-60">/ mes</span>
                    </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Pendientes de Activación</p>
                    {/* Usar pendingTenants.length como única fuente de verdad, consistente con la tabla */}
                    <p className="text-3xl font-display font-bold text-amber-500">{pendingTenants.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Cuentas esperando confirmación de pago</p>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                SECCIÓN 1 — Cuentas pendientes de activación (tabla paginada)
            ══════════════════════════════════════════════════════════════════ */}
            <section className="mb-10">
                <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    Cuentas pendientes de activación
                    <span className="text-sm font-normal text-muted-foreground">({pendingTenants.length})</span>
                </h2>

                {pendingTenants.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-10 text-center">
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm font-semibold">Sin cuentas pendientes</p>
                        <p className="text-xs text-muted-foreground mt-1">Todas las cuentas están activas o al día.</p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border bg-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40">
                                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Negocio</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap hidden sm:table-cell">Email</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap hidden md:table-cell">Plan</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Estado</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap hidden lg:table-cell">Registrado</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {tenantPager.slice.map(t => (
                                        <tr
                                            key={t.id}
                                            className={`hover:bg-muted/20 transition-colors ${t.deleted_at ? 'opacity-60' : ''}`}
                                        >
                                            {/* Negocio */}
                                            <td className="px-4 py-3 align-middle">
                                                <p className={`font-semibold truncate max-w-40 ${t.deleted_at ? 'line-through text-muted-foreground' : ''}`}>
                                                    {t.name}
                                                </p>
                                                {t.subdomain && (
                                                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{t.subdomain}</p>
                                                )}
                                            </td>

                                            {/* Email */}
                                            <td className="px-4 py-3 align-middle text-xs text-muted-foreground truncate max-w-48 hidden sm:table-cell">
                                                {t.email}
                                            </td>

                                            {/* Plan */}
                                            <td className="px-4 py-3 align-middle hidden md:table-cell">
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                    {PLAN_LABELS[t.plan] ?? t.plan}
                                                </span>
                                            </td>

                                            {/* Estado */}
                                            <td className="px-4 py-3 align-middle whitespace-nowrap">
                                                {t.deleted_at ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                                                        <Ban className="h-2.5 w-2.5" /> Eliminada
                                                    </span>
                                                ) : (
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${t.payment_status === 'pending_review'
                                                        ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                                                        : 'bg-muted text-muted-foreground border-border'
                                                        }`}>
                                                        {t.payment_status === 'pending_review' ? 'Con comprobante' : 'Sin comprobante'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Registrado */}
                                            <td className="px-4 py-3 align-middle text-xs text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                                                {t.created_at}
                                            </td>

                                            {/* Acciones */}
                                            <td className="px-4 py-3 align-middle whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {t.payment_evidence_path && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEvidencePreview(t.payment_evidence_path!)}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" /> Comprobante
                                                        </button>
                                                    )}
                                                    {!t.deleted_at && (
                                                        <button
                                                            type="button"
                                                            onClick={() => activateTenant(t.id)}
                                                            disabled={activatingId === t.id}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/90 text-accent-foreground text-[11px] font-bold hover:bg-accent transition-colors disabled:opacity-50"
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                            {activatingId === t.id ? 'Activando…' : 'Activar'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pager
                            page={tenantPager.page}
                            totalPages={tenantPager.totalPages}
                            setPage={tenantPager.setPage}
                            total={pendingTenants.length}
                        />
                    </div>
                )}
            </section>

            {/* ══════════════════════════════════════════════════════════════════
                SECCIÓN 2 — Reporte Publicitario pendientes: Banner / MockUp
            ══════════════════════════════════════════════════════════════════ */}
            <section className="mb-10">
                <h2 className="text-lg font-display font-bold mb-1 flex items-center gap-2">
                    <Image className="h-5 w-5 text-violet-400" />
                    Reporte Publicitario — Banner Principal
                    <span className="text-sm font-normal text-muted-foreground">
                        ({adRequestsBanner.length} pendiente{adRequestsBanner.length !== 1 ? 's' : ''})
                    </span>
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                    Solicitudes de banner pendientes de publicación o cancelación.
                </p>
                <AdRequestTable requests={adRequestsBanner} context="banner" hideHeader />
            </section>

            {/* ══════════════════════════════════════════════════════════════════
                SECCIÓN 3 — Reporte Publicitario pendientes: Slider de Negocios
            ══════════════════════════════════════════════════════════════════ */}
            <section className="mb-10">
                <h2 className="text-lg font-display font-bold mb-1 flex items-center gap-2">
                    <Store className="h-5 w-5 text-blue-400" />
                    Reporte Publicitario — Slider de Negocios
                    <span className="text-sm font-normal text-muted-foreground">
                        ({adRequestsSlider.length} pendiente{adRequestsSlider.length !== 1 ? 's' : ''})
                    </span>
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                    Solicitudes de logo en slider pendientes de publicación o cancelación.
                </p>
                <AdRequestTable requests={adRequestsSlider} context="slider" hideHeader />
            </section>

            {/* ── Métodos de pago de la plataforma ─────────────────────────────── */}
            <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-display font-bold flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Métodos de pago de la plataforma
                    </h2>
                    <button
                        type="button"
                        onClick={() => setEditingMethod(null)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" /> Agregar método
                    </button>
                </div>

                {paymentMethods.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                        <Building className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            No hay métodos de pago configurados. Los clientes verán esta lista al registrarse.
                        </p>
                        <button
                            type="button"
                            onClick={() => setEditingMethod(null)}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                        >
                            <Plus className="h-4 w-4" /> Agregar el primero
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {paymentMethods.map(m => (
                            <div key={m.id} className={`rounded-2xl border p-5 transition-colors ${m.active ? 'border-border bg-card' : 'border-border/40 bg-muted/20 opacity-60'}`}>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-foreground">{m.name}</p>
                                        <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{m.account_info}</p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => toggleMethod(m.id)}
                                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                            title={m.active ? 'Desactivar' : 'Activar'}>
                                            {m.active
                                                ? <ToggleRight className="h-4 w-4 text-accent" />
                                                : <ToggleLeft className="h-4 w-4" />
                                            }
                                        </button>
                                        <button onClick={() => setEditingMethod(m)}
                                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={() => deleteMethod(m.id, m.name)}
                                            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                                {m.instructions && (
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{m.instructions}</p>
                                )}
                                <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5">
                                    <div className={`h-1.5 w-1.5 rounded-full ${m.active ? 'bg-accent' : 'bg-muted-foreground/40'}`} />
                                    <span className="text-[10px] text-muted-foreground font-medium">
                                        {m.active ? 'Visible para nuevos clientes' : 'Oculto para nuevos clientes'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Historial de cuentas ───────────────────────────────────────── */}
            <section>
                <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                    <History className="h-5 w-5 text-muted-foreground" />
                    Historial de cuentas
                </h2>

                {/* Pestañas */}
                <div className="flex gap-1 mb-4 p-1 rounded-xl bg-muted w-fit">
                    {(
                        [
                            { key: 'activas', label: 'Activas', color: 'text-accent' },
                            { key: 'inactivas', label: 'Inactivas', color: 'text-amber-500' },
                            { key: 'eliminadas', label: 'Eliminadas', color: 'text-red-500' },
                        ] as { key: HistoryTab; label: string; color: string }[]
                    ).map(tab => {
                        const count = tenantHistory[tab.key].length;
                        const isActive = historyTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setHistoryTab(tab.key)}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isActive
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {tab.label}
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? `bg-muted ${tab.color}` : 'bg-muted/60 text-muted-foreground'
                                    }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Tabla de historial con paginación */}
                {(() => {
                    const list = tenantHistory[historyTab];
                    const page = historyPages[historyTab];
                    const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
                    // Clampear en caso de que historyPages esté un render por delante del useEffect corrector
                    const safePage = Math.min(page, totalPages);
                    const slice = list.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

                    const goTo = (p: number) => {
                        setHistoryPages(prev => ({ ...prev, [historyTab]: p }));
                    };

                    if (list.length === 0) {
                        return (
                            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                                <CheckCircle2 className="h-7 w-7 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    No hay cuentas en esta categoría.
                                </p>
                            </div>
                        );
                    }

                    return (
                        <div className="rounded-2xl border border-border bg-card overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40">
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">Nombre</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground hidden md:table-cell">Plan</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Subdominio</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            {historyTab === 'eliminadas' ? 'Eliminado' : 'Registrado'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {slice.map(t => (
                                        <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className={`font-medium text-foreground truncate max-w-40 ${t.deleted_at ? 'line-through text-muted-foreground' : ''}`}>
                                                    {t.name}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground sm:hidden truncate">{t.email}</p>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell truncate max-w-45">{t.email}</td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                                                    {PLAN_LABELS[t.plan] ?? t.plan}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground text-xs font-mono hidden lg:table-cell">
                                                {t.subdomain ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                                {historyTab === 'eliminadas' ? (t.deleted_at ?? '—') : t.created_at}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <Pager page={safePage} totalPages={totalPages} setPage={goTo} total={list.length} />
                        </div>
                    );
                })()}
            </section>
        </AppShell>
    );
}
