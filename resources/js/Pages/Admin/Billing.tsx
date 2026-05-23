import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    CreditCard, CheckCircle2, Clock, Zap, Crown, Building,
    Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Save,
    Eye, Check,
} from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface PaymentMethod {
    id:           number;
    name:         string;
    account_info: string;
    instructions: string | null;
    active:       boolean;
    sort_order:   number;
}

interface PendingTenant {
    id:                    string;
    name:                  string;
    email:                 string;
    plan:                  string;
    payment_status:        string;
    payment_evidence_path: string | null;
    payment_evidence_at:   string | null;
    subdomain:             string;
    created_at:            string;
}

interface Props {
    stats: {
        por_plan:      Record<string, number>;
        total_revenue: number;
    };
    pendingTenants: PendingTenant[];
    paymentMethods: PaymentMethod[];
    flash?: { success?: string };
}

const PLAN_PRICES: Record<string, number> = {
    mensual: 30000, trimestral: 80000, semestral: 220000, anual: 350000,
};

const PLAN_LABELS: Record<string, string> = {
    mensual: 'Mensual', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual',
};

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

// ── Modal de método de pago ────────────────────────────────────────────────────

interface MethodModalProps {
    method: PaymentMethod | null;
    onClose: () => void;
}

function MethodModal({ method, onClose }: MethodModalProps) {
    const [form, setForm] = useState({
        name:         method?.name         ?? '',
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
                onFinish:  () => setSaving(false),
            });
        } else {
            router.post('/admin/payment-methods', form, {
                onSuccess: () => onClose(),
                onFinish:  () => setSaving(false),
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

export default function Billing({ stats, pendingTenants, paymentMethods, flash }: Props) {
    const [editingMethod,   setEditingMethod]   = useState<PaymentMethod | null | false>(false);
    const [activatingId,    setActivatingId]    = useState<string | null>(null);
    const [evidencePreview, setEvidencePreview] = useState<string | null>(null);

    const plans = [
        { key: 'mensual',    name: 'Mensual',    icon: Clock,  color: 'text-zinc-500'   },
        { key: 'trimestral', name: 'Trimestral', icon: Zap,    color: 'text-blue-500'   },
        { key: 'semestral',  name: 'Semestral',  icon: Crown,  color: 'text-purple-500' },
        { key: 'anual',      name: 'Anual',      icon: Crown,  color: 'text-amber-500'  },
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

            {/* Modal de evidencia */}
            {evidencePreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setEvidencePreview(null)}>
                    <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setEvidencePreview(null)}
                            className="absolute -top-4 -right-4 p-2 rounded-full bg-card text-foreground hover:bg-muted">
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

            {/* ── Estadísticas de planes ── */}
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
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Ingresos Estimados Mensuales</p>
                    <p className="text-3xl font-display font-bold text-foreground">{fmt(stats.total_revenue)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Pendientes de Activación</p>
                    <p className="text-3xl font-display font-bold text-amber-500">{pendingTenants.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Cuentas esperando confirmación de pago</p>
                </div>
            </div>

            {/* ── Tenants pendientes ── */}
            {pendingTenants.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-500" />
                        Cuentas pendientes de activación
                    </h2>
                    <div className="space-y-3">
                        {pendingTenants.map(t => (
                            <div key={t.id} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-sm text-foreground">{t.name}</p>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                t.payment_status === 'pending_review'
                                                    ? 'bg-amber-500/20 text-amber-600'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}>
                                                {t.payment_status === 'pending_review' ? 'Con comprobante' : 'Sin comprobante'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{t.email}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {t.subdomain} · Plan {PLAN_LABELS[t.plan] ?? t.plan} · Registrado {t.created_at}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {t.payment_evidence_path && (
                                            <button
                                                type="button"
                                                onClick={() => setEvidencePreview(t.payment_evidence_path!)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                                            >
                                                <Eye className="h-3.5 w-3.5" /> Ver comprobante
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => activateTenant(t.id)}
                                            disabled={activatingId === t.id}
                                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-bold hover:bg-accent/90 transition-colors disabled:opacity-50"
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                            {activatingId === t.id ? 'Activando…' : 'Activar cuenta'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Métodos de pago de la plataforma ── */}
            <section>
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
        </AppShell>
    );
}
