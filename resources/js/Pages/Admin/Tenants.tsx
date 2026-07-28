import AppShell from '@/Layouts/AppShell';
import { Head, useForm, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    Power, Trash2, ExternalLink, Mail, Calendar,
    ShieldCheck, ShieldAlert, Utensils, Zap, MapPin,
    Check, Pencil, X, Save, CheckCircle2, Clock, AlertTriangle,
    Eye, EyeOff,
} from 'lucide-react';

interface Tenant {
    id:             string;
    name:           string;
    email:          string;
    plan:           string;
    active:         boolean;
    payment_status: string;
    subdomain:      string;
    expires_at:     string | null;
    created_at:     string;
    address:        string | null;
}

interface Props {
    tenants: Tenant[];
    flash?:  { success?: string; error?: string };
}

function toSlug(str: string): string {
    return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '');
}

const PLAN_LABELS: Record<string, string> = {
    starter:    'Starter (legacy)',
    basico:     '1 mes',
    trimestral: '3 meses',
    semestral:  '6 meses',
    anual:      '12 meses',
    mensual:    'Mensual (legacy)', // compatibilidad con registros anteriores en DB
};
const PLAN_COLORS: Record<string, string> = {
    starter:    'bg-emerald-100 text-emerald-700',
    basico:     'bg-zinc-100 text-zinc-700',
    trimestral: 'bg-blue-100 text-blue-700',
    semestral:  'bg-purple-100 text-purple-700',
    anual:      'bg-indigo-100 text-indigo-700',
    mensual:    'bg-zinc-100 text-zinc-600',   // legacy
};

// ── Modal de edición ──────────────────────────────────────────────────────────

interface EditModalProps {
    tenant:   Tenant;
    onClose:  () => void;
}

function EditModal({ tenant, onClose }: EditModalProps) {
    const [form, setForm] = useState({
        name:               tenant.name,
        email:              tenant.email,
        plan:               tenant.plan,
        expires_at:         tenant.expires_at?.split('T')[0] ?? '',
        restaurant_address: tenant.address ?? '',
    });
    const [saving, setSaving] = useState(false);

    function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        router.put(`/admin/tenants/${tenant.id}`, form, {
            onSuccess: () => onClose(),
            onFinish:  () => setSaving(false),
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
                    <div>
                        <h2 className="text-base font-bold text-foreground">Editar local</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{tenant.subdomain}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
                    {/* Nombre */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Nombre del negocio</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                className="w-full rounded-xl border border-input bg-input pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </div>
                    </div>

                    {/* Plan + Vencimiento */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Plan</label>
                            <select
                                value={form.plan}
                                onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                                className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                            >
                                <option value="basico">1 mes · $20.000</option>
                                <option value="trimestral">3 meses · $50.000</option>
                                <option value="semestral">6 meses · $110.000</option>
                                <option value="anual">12 meses · $200.000</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Vencimiento</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <input
                                    type="date"
                                    value={form.expires_at}
                                    onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                                    className="w-full rounded-xl border border-input bg-input pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Dirección */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Dirección del establecimiento</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <input
                                type="text"
                                value={form.restaurant_address}
                                onChange={e => setForm(f => ({ ...f, restaurant_address: e.target.value }))}
                                placeholder="Ej: Carrera 5 #10-20, Cali"
                                autoComplete="off"
                                className="w-full rounded-xl border border-input bg-input pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                            <Save className="h-4 w-4" />
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Modal de confirmación de eliminación ──────────────────────────────────────

interface DeleteModalProps {
    tenant:    Tenant;
    deleting:  boolean;
    onConfirm: () => void;
    onClose:   () => void;
}

function DeleteConfirmModal({ tenant, deleting, onConfirm, onClose }: DeleteModalProps) {
    const isActive  = tenant.active;
    const isPending = tenant.payment_status === 'pending_payment' || tenant.payment_status === 'pending_review';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-start gap-4 px-6 pt-6 pb-5">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-500/10 border border-red-500/20">
                        <Trash2 className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-base font-bold text-foreground">Eliminar local permanentemente</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Esta acción no se puede deshacer.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-6 pb-6 space-y-4">
                    {/* Nombre del local */}
                    <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-zinc-100 to-zinc-200 border border-zinc-300 flex items-center justify-center font-display font-bold text-zinc-600 shrink-0 text-sm">
                                {tenant.name[0]}
                            </div>
                            <div>
                                <p className="font-bold text-foreground text-sm">{tenant.name}</p>
                                <p className="text-xs text-muted-foreground">{tenant.subdomain}</p>
                            </div>
                        </div>
                    </div>

                    {/* Advertencia si está activo */}
                    {(isActive || isPending) && (
                        <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${
                            isActive
                                ? 'bg-red-500/8 border-red-500/25 text-red-700'
                                : 'bg-amber-500/8 border-amber-500/25 text-amber-700'
                        }`}>
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <p className="text-xs font-semibold leading-relaxed">
                                {isActive
                                    ? 'Este local está activo con una suscripción vigente. Al eliminarlo se desactivará el acceso y se borrará su base de datos operativa (menú, pedidos, usuarios).'
                                    : 'Este local tiene un pago en proceso. El registro del pago y el comprobante adjunto quedarán preservados en el historial de facturación.'}
                            </p>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                        Se eliminará la base de datos operativa y el dominio <strong className="text-foreground">{tenant.subdomain}</strong>.
                        El historial de registro y facturación queda conservado.
                    </p>

                    {/* Acciones */}
                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={deleting}
                            className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={deleting}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="h-4 w-4" />
                            {deleting ? 'Eliminando…' : 'Sí, eliminar permanentemente'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Tenants({ tenants, flash }: Props) {
    const [showForm,      setShowForm]      = useState(false);
    const [processingId,  setProcessingId]  = useState<string | null>(null);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [activatingId,  setActivatingId]  = useState<string | null>(null);
    const [deleteTarget,  setDeleteTarget]  = useState<Tenant | null>(null);
    const [deleting,      setDeleting]      = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        type:                  'restaurante' as 'restaurante' | 'puesto',
        plan:                  'basico',
        name:                  '',
        subdomain:             '',
        owner_name:            '',
        phone:                 '',
        email:                 '',
        password:              '',
        password_confirmation: '',
        restaurant_address:    '',
        restaurant_lat:        null as number | null,
        restaurant_lng:        null as number | null,
    });

    const [showPassword,    setShowPassword]    = useState(false);
    const [showConfirm,     setShowConfirm]     = useState(false);

    useEffect(() => {
        setData('subdomain', toSlug(data.name));
    }, [data.name]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/tenants', {
            onSuccess: () => { reset(); setShowForm(false); },
        });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/admin/tenants/${deleteTarget.id}`, {
            onFinish: () => { setDeleting(false); setDeleteTarget(null); },
        });
    }

    function toggleStatus(id: string) {
        setProcessingId(id);
        router.patch(`/admin/tenants/${id}/status`, {}, { onFinish: () => setProcessingId(null) });
    }

    function activateTenant(id: string) {
        setActivatingId(id);
        router.patch(`/admin/tenants/${id}/activate`, {}, { onFinish: () => setActivatingId(null) });
    }

    return (
        <AppShell title="Gestión de Locales" subtitle="Administración global de tenants y acceso" variant="admin">
            <Head title="SuperAdmin - Restaurantes" />

            {/* Modal de edición */}
            {editingTenant && (
                <EditModal tenant={editingTenant} onClose={() => setEditingTenant(null)} />
            )}

            {/* Modal de confirmación de eliminación */}
            {deleteTarget && (
                <DeleteConfirmModal
                    tenant={deleteTarget}
                    deleting={deleting}
                    onConfirm={confirmDelete}
                    onClose={() => !deleting && setDeleteTarget(null)}
                />
            )}

            {/* Flash */}
            {flash?.success && (
                <div className="mb-6 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
                    {flash.success}
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-display font-bold text-foreground">Restaurantes Registrados</h1>
                    <p className="text-sm text-muted-foreground">{tenants.length} negocios en la plataforma</p>
                </div>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                        showForm ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                >
                    {showForm ? 'Cerrar Formulario' : '+ Registrar Nuevo Local'}
                </button>
            </div>

            {/* Formulario de Creación */}
            {showForm && (
                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-primary/5">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold">Nuevo Registro</h2>
                            <p className="text-sm text-muted-foreground">La base de datos y el subdominio se aprovisionarán automáticamente.</p>
                        </div>

                        {/* Tipo de negocio */}
                        <div className="mb-6">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Tipo de Negocio</p>
                            <div className="grid grid-cols-2 gap-3 max-w-sm">
                                {([
                                    { key: 'restaurante', icon: Utensils, label: 'Restaurante',             desc: 'Mesas, comandas, cocina' },
                                    { key: 'puesto',      icon: Zap,      label: 'Puesto de Comida Rápida', desc: 'Ágil y sin complicaciones' },
                                ] as const).map(({ key, icon: Icon, label, desc }) => {
                                    const sel = data.type === key;
                                    return (
                                        <button key={key} type="button" onClick={() => setData('type', key)}
                                            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${sel ? 'border-primary bg-primary/8' : 'border-border hover:border-primary/40'}`}>
                                            <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${sel ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className={`text-xs font-semibold leading-tight ${sel ? 'text-primary' : 'text-foreground'}`}>{label}</p>
                                                <p className="text-[10px] text-muted-foreground">{desc}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.type && <p className="text-[10px] font-bold text-red-500 mt-1">× {errors.type}</p>}
                        </div>

                        {/* Datos del establecimiento */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <Field label="Nombre del Negocio" error={errors.name}>
                                <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                                    placeholder="Ej. Parrilla Don Juan" className="input-modern" />
                            </Field>

                            <Field label="Plan" error={errors.plan}>
                                <select value={data.plan} onChange={e => setData('plan', e.target.value)} className="input-modern appearance-none">
                                    <option value="basico">1 mes · $20.000</option>
                                    <option value="trimestral">3 meses · $50.000</option>
                                    <option value="semestral">6 meses · $110.000</option>
                                    <option value="anual">12 meses · $200.000</option>
                                </select>
                            </Field>

                            <Field label="Subdominio" error={errors.subdomain} hint="Solo minúsculas, sin espacios ni caracteres especiales.">
                                <div className="flex items-center rounded-xl border-[1.5px] border-border bg-input hover:border-foreground/50 focus-within:border-primary focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_20%,transparent)] transition-all overflow-hidden">
                                    <input type="text" value={data.subdomain} onChange={e => setData('subdomain', e.target.value.toLowerCase())}
                                        placeholder="mi-negocio" className="flex-1 px-4 py-2.5 bg-transparent text-sm outline-none font-semibold placeholder:text-muted-foreground/55" />
                                    <span className="px-4 py-2.5 bg-muted text-muted-foreground text-xs font-bold border-l border-border select-none">.Menugo.local</span>
                                </div>
                            </Field>

                            <Field label="Dirección del Establecimiento" error={errors.restaurant_address} hint="Opcional.">
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <input type="text" value={data.restaurant_address}
                                        onChange={e => setData('restaurant_address', e.target.value)}
                                        placeholder="Ej: Carrera 5 #10-20, Cali"
                                        className="input-modern pl-10" autoComplete="off" />
                                </div>
                            </Field>
                        </div>

                        {/* Datos del administrador */}
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Administrador</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field label="Nombre Completo" error={errors.owner_name}>
                                <input type="text" value={data.owner_name} onChange={e => setData('owner_name', e.target.value)}
                                    placeholder="Ej: Carlos Méndez" className="input-modern" />
                            </Field>

                            <Field label="Teléfono / WhatsApp" error={errors.phone}>
                                <input type="tel" value={data.phone} onChange={e => setData('phone', e.target.value)}
                                    placeholder="+57 300 000 0000" className="input-modern" />
                            </Field>

                            <Field label="Email Administrativo" error={errors.email}>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                        placeholder="admin@ejemplo.com" className="input-modern pl-10" />
                                </div>
                            </Field>

                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Contraseña" error={errors.password}>
                                    <div className="relative">
                                        <input type={showPassword ? 'text' : 'password'} value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            placeholder="Mín. 8 caracteres" className="input-modern pr-10" autoComplete="new-password" />
                                        <button type="button" onClick={() => setShowPassword(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </Field>
                                <Field label="Confirmar">
                                    <div className="relative">
                                        <input type={showConfirm ? 'text' : 'password'} value={data.password_confirmation}
                                            onChange={e => setData('password_confirmation', e.target.value)}
                                            placeholder="Repite" className="input-modern pr-10" autoComplete="new-password" />
                                        <button type="button" onClick={() => setShowConfirm(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </Field>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-border flex justify-end">
                            <button type="submit" disabled={processing} className="px-8 py-3 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-lg">
                                {processing ? 'Procesando Infraestructura...' : 'Confirmar y Crear Local'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Listado Principal */}
            <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/30 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                                <th className="text-left px-6 py-5 font-bold">Identificación / Dirección</th>
                                <th className="text-left px-6 py-5 font-bold">Acceso Directo</th>
                                <th className="text-left px-6 py-5 font-bold">Estado</th>
                                <th className="text-left px-6 py-5 font-bold">Suscripción</th>
                                <th className="text-right px-6 py-5 font-bold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tenants.map(tenant => (
                                <tr key={tenant.id} className="group hover:bg-muted/20 transition-colors">
                                    {/* Identificación + dirección */}
                                    <td className="px-6 py-5">
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 border border-zinc-300 flex items-center justify-center font-display font-bold text-zinc-600 shrink-0">
                                                {tenant.name[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-foreground">{tenant.name}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Mail className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{tenant.email}</span>
                                                </div>
                                                {tenant.address ? (
                                                    <div className="text-xs text-muted-foreground flex items-start gap-1 mt-1 max-w-xs">
                                                        <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-primary/60" />
                                                        <span className="truncate" title={tenant.address}>{tenant.address}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-muted-foreground/40 flex items-center gap-1 mt-1">
                                                        <MapPin className="h-3 w-3" />
                                                        Sin dirección registrada
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Acceso */}
                                    <td className="px-6 py-5">
                                        <a href={`http://${tenant.subdomain}`} target="_blank"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition-colors">
                                            {tenant.subdomain}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </td>

                                    {/* Estado */}
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border w-fit ${
                                                tenant.active
                                                    ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                                    : 'bg-red-500/10 text-red-600 border-red-500/20'
                                            }`}>
                                                {tenant.active ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                                                {tenant.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                            {tenant.payment_status === 'trial' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider w-fit bg-blue-500/15 text-blue-600 border border-blue-500/25">
                                                    🎁 En prueba
                                                </span>
                                            )}
                                            {(tenant.payment_status === 'pending_payment' || tenant.payment_status === 'pending_review') && (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider w-fit ${
                                                    tenant.payment_status === 'pending_review'
                                                        ? 'bg-amber-500/15 text-amber-600 border border-amber-500/25'
                                                        : 'bg-muted text-muted-foreground border border-border'
                                                }`}>
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {tenant.payment_status === 'pending_review' ? 'Pago en revisión' : 'Pago pendiente'}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Suscripción */}
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded w-fit font-bold uppercase tracking-tight ${PLAN_COLORS[tenant.plan] ?? 'bg-zinc-100 text-zinc-700'}`}>
                                                {PLAN_LABELS[tenant.plan] ?? tenant.plan}
                                            </span>
                                            {tenant.payment_status === 'trial' && tenant.expires_at && (
                                                <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-500 mt-1">
                                                    <span>🎁</span>
                                                    Prueba hasta {new Date(tenant.expires_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                                                </div>
                                            )}
                                            {tenant.payment_status !== 'trial' && tenant.expires_at && (
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                                                    <Calendar className="h-3 w-3 shrink-0" />
                                                    {new Date(tenant.expires_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Acciones */}
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-end gap-2 flex-wrap">
                                            {/* Activar pago — solo para cuentas pendientes */}
                                            {(tenant.payment_status === 'pending_payment' || tenant.payment_status === 'pending_review') && (
                                                <button
                                                    onClick={() => activateTenant(tenant.id)}
                                                    disabled={activatingId === tenant.id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-bold hover:bg-accent/90 transition-colors disabled:opacity-50"
                                                    title="Confirmar pago y activar cuenta"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    {activatingId === tenant.id ? 'Activando…' : 'Activar'}
                                                </button>
                                            )}
                                            {/* Editar */}
                                            <button
                                                onClick={() => setEditingTenant(tenant)}
                                                className="p-2 rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
                                                title="Editar local"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            {/* Activar / Suspender */}
                                            <button
                                                onClick={() => toggleStatus(tenant.id)}
                                                disabled={processingId === tenant.id}
                                                className={`p-2 rounded-xl border transition-all ${
                                                    tenant.active
                                                        ? 'border-red-200 text-red-500 hover:bg-red-50'
                                                        : 'border-green-200 text-green-500 hover:bg-green-50'
                                                }`}
                                                title={tenant.active ? 'Suspender Acceso' : 'Activar Acceso'}
                                            >
                                                <Power className={`h-4 w-4 ${processingId === tenant.id ? 'animate-pulse' : ''}`} />
                                            </button>
                                            {/* Eliminar */}
                                            <button
                                                onClick={() => setDeleteTarget(tenant)}
                                                disabled={deleting}
                                                className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-all"
                                                title="Eliminar permanentemente"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .input-modern {
                    width: 100%; border-radius: 0.75rem;
                    border: 1.5px solid var(--border);
                    background-color: var(--input);
                    color: var(--foreground);
                    padding: 0.625rem 1rem; font-size: 0.875rem;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    outline: none;
                }
                .input-modern::placeholder {
                    color: var(--muted-foreground);
                    opacity: 0.6;
                }
                .input-modern:hover:not(:focus) {
                    border-color: color-mix(in oklch, var(--border) 50%, var(--foreground) 50%);
                }
                .input-modern:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px color-mix(in oklch, var(--primary) 20%, transparent);
                }
                .input-modern.pl-10 {
                    padding-left: 2.5rem;
                }
                .input-modern.pr-10 {
                    padding-right: 2.5rem;
                }
            `}</style>
        </AppShell>
    );
}

function Field({ label, error, hint, children }: {
    label: string; error?: string; hint?: string; children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">{label}</label>
            {children}
            {hint  && <p className="text-[10px] text-muted-foreground italic ml-1">{hint}</p>}
            {error && <p className="text-[10px] font-bold text-red-500 ml-1">× {error}</p>}
        </div>
    );
}
