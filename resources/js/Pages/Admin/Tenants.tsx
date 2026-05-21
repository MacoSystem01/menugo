import AppShell from '@/Layouts/AppShell';
import { Head, useForm, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    Power, Trash2, ExternalLink, Mail, Calendar,
    ShieldCheck, ShieldAlert, Utensils, Zap, MapPin,
    Check, Pencil, X, Save,
} from 'lucide-react';

interface Tenant {
    id:          string;
    name:        string;
    email:       string;
    plan:        string;
    active:      boolean;
    subdomain:   string;
    expires_at:  string | null;
    created_at:  string;
    address:     string | null;
}

interface Props {
    tenants: Tenant[];
    flash?:  { success?: string; error?: string };
}

function toSlug(str: string): string {
    return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '');
}

const PLAN_LABELS: Record<string, string> = {
    mensual: 'Mensual', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual',
};
const PLAN_COLORS: Record<string, string> = {
    mensual: 'bg-zinc-100 text-zinc-700', trimestral: 'bg-blue-100 text-blue-700',
    semestral: 'bg-purple-100 text-purple-700', anual: 'bg-indigo-100 text-indigo-700',
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

    // Nominatim autocomplete para dirección
    const [suggestions, setSuggestions]   = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
    const [showSugg,    setShowSugg]      = useState(false);
    const [addrOk,      setAddrOk]        = useState(!!tenant.address);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function onAddressChange(val: string) {
        setForm(f => ({ ...f, restaurant_address: val }));
        setAddrOk(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (val.trim().length < 3) { setSuggestions([]); setShowSugg(false); return; }
        timeoutRef.current = setTimeout(async () => {
            try {
                const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=4`, { headers: { 'Accept-Language': 'es' } });
                const json = await res.json();
                setSuggestions(json);
                setShowSugg(json.length > 0);
            } catch { /* ignorar */ }
        }, 400);
    }

    function onAddrSelect(s: { display_name: string }) {
        setForm(f => ({ ...f, restaurant_address: s.display_name }));
        setAddrOk(true);
        setShowSugg(false);
        setSuggestions([]);
    }

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
                                <option value="mensual">Mensual</option>
                                <option value="trimestral">Trimestral</option>
                                <option value="semestral">Semestral</option>
                                <option value="anual">Anual</option>
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
                                onChange={e => onAddressChange(e.target.value)}
                                placeholder="Ej: Carrera 5 #10-20, Cali"
                                autoComplete="off"
                                className="w-full rounded-xl border border-input bg-input pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                            {showSugg && (
                                <div className="absolute z-20 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden mt-1">
                                    {suggestions.map((s, i) => (
                                        <button key={i} type="button" onClick={() => onAddrSelect(s)}
                                            className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted transition-colors border-b border-border last:border-0 leading-snug">
                                            {s.display_name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {addrOk && (
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-green-500">
                                <Check className="h-3 w-3" /> Dirección seleccionada del mapa
                            </p>
                        )}
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

// ── Componente principal ──────────────────────────────────────────────────────

export default function Tenants({ tenants, flash }: Props) {
    const [showForm,     setShowForm]     = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        type:                  'restaurante' as 'restaurante' | 'puesto',
        plan:                  'mensual',
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

    const [addrSuggestions, setAddrSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
    const [showAddrSugg,    setShowAddrSugg]    = useState(false);
    const [addrValidated,   setAddrValidated]   = useState(false);
    const addrTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onAddressChange = (val: string) => {
        setData('restaurant_address', val);
        setData('restaurant_lat', null);
        setData('restaurant_lng', null);
        setAddrValidated(false);
        if (addrTimeoutRef.current) clearTimeout(addrTimeoutRef.current);
        if (val.trim().length < 3) { setAddrSuggestions([]); setShowAddrSugg(false); return; }
        addrTimeoutRef.current = setTimeout(async () => {
            try {
                const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=4`, { headers: { 'Accept-Language': 'es' } });
                const json = await res.json();
                setAddrSuggestions(json);
                setShowAddrSugg(json.length > 0);
            } catch { /* ignorar */ }
        }, 400);
    };

    const onAddrSelect = (s: { display_name: string; lat: string; lon: string }) => {
        setData('restaurant_address', s.display_name);
        setData('restaurant_lat', parseFloat(s.lat));
        setData('restaurant_lng', parseFloat(s.lon));
        setAddrValidated(true);
        setShowAddrSugg(false);
        setAddrSuggestions([]);
    };

    useEffect(() => {
        setData('subdomain', toSlug(data.name));
    }, [data.name]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/tenants', {
            onSuccess: () => { reset(); setShowForm(false); setAddrValidated(false); },
        });
    }

    function handleDelete(tenant: Tenant) {
        let message = `¿Estás seguro de eliminar permanentemente el local "${tenant.name}"?`;
        if (tenant.active && !tenant.expires_at) {
            message = `⚠️ ATENCIÓN: El local "${tenant.name}" se encuentra ACTIVO y sin fecha de vencimiento. \n\n¿Realmente deseas eliminarlo? Esta acción es irreversible.`;
        } else if (tenant.active) {
            message = `El local "${tenant.name}" está ACTIVO. ¿Deseas eliminarlo permanentemente?`;
        }
        if (!confirm(message)) return;
        setProcessingId(tenant.id);
        router.delete(`/admin/tenants/${tenant.id}`, { onFinish: () => setProcessingId(null) });
    }

    function toggleStatus(id: string) {
        setProcessingId(id);
        router.patch(`/admin/tenants/${id}/status`, {}, { onFinish: () => setProcessingId(null) });
    }

    return (
        <AppShell title="Gestión de Locales" subtitle="Administración global de tenants y acceso" variant="admin">
            <Head title="SuperAdmin - Restaurantes" />

            {/* Modal de edición */}
            {editingTenant && (
                <EditModal tenant={editingTenant} onClose={() => setEditingTenant(null)} />
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
                                    <option value="mensual">Mensual · $30.000</option>
                                    <option value="trimestral">Trimestral · $80.000</option>
                                    <option value="semestral">Semestral · $220.000</option>
                                    <option value="anual">Anual · $350.000</option>
                                </select>
                            </Field>

                            <Field label="Subdominio" error={errors.subdomain} hint="Solo minúsculas, sin espacios ni caracteres especiales.">
                                <div className="flex items-center rounded-xl border border-border bg-muted/20 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/40 transition-all overflow-hidden">
                                    <input type="text" value={data.subdomain} onChange={e => setData('subdomain', e.target.value.toLowerCase())}
                                        placeholder="mi-negocio" className="flex-1 px-4 py-2.5 bg-transparent text-sm outline-none font-semibold" />
                                    <span className="px-4 py-2.5 bg-muted text-muted-foreground text-xs font-bold border-l border-border select-none">.Menugo.local</span>
                                </div>
                            </Field>

                            <Field label="Dirección del Establecimiento" error={errors.restaurant_address} hint="Opcional — activa la asignación automática de zona de domicilio.">
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <input type="text" value={data.restaurant_address}
                                        onChange={e => onAddressChange(e.target.value)}
                                        placeholder="Ej: Carrera 5 #10-20, Cali"
                                        className="input-modern pl-10" autoComplete="off" />
                                    {showAddrSugg && (
                                        <div className="absolute z-20 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                                            {addrSuggestions.map((s, i) => (
                                                <button key={i} type="button" onClick={() => onAddrSelect(s)}
                                                    className="w-full text-left px-4 py-2.5 text-xs text-foreground hover:bg-muted transition-colors border-b border-border last:border-0 leading-snug">
                                                    {s.display_name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {addrValidated && (
                                        <p className="mt-1 flex items-center gap-1 text-[10px]" style={{ color: '#22c55e' }}>
                                            <Check className="h-3 w-3" />
                                            Ubicación confirmada · {data.restaurant_lat?.toFixed(5)}, {data.restaurant_lng?.toFixed(5)}
                                        </p>
                                    )}
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
                                    <input type="password" value={data.password} onChange={e => setData('password', e.target.value)}
                                        placeholder="Mín. 8 caracteres" className="input-modern" autoComplete="new-password" />
                                </Field>
                                <Field label="Confirmar">
                                    <input type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)}
                                        placeholder="Repite" className="input-modern" autoComplete="new-password" />
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
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border ${
                                            tenant.active
                                                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                                : 'bg-red-500/10 text-red-600 border-red-500/20'
                                        }`}>
                                            {tenant.active ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                                            {tenant.active ? 'Activo' : 'Suspendido'}
                                        </span>
                                    </td>

                                    {/* Suscripción */}
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded w-fit font-bold uppercase tracking-tight ${PLAN_COLORS[tenant.plan] ?? 'bg-zinc-100 text-zinc-700'}`}>
                                                {PLAN_LABELS[tenant.plan] ?? tenant.plan}
                                            </span>
                                            {tenant.expires_at && (
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                                                    <Calendar className="h-3 w-3 shrink-0" />
                                                    {new Date(tenant.expires_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Acciones */}
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-end gap-2">
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
                                                onClick={() => handleDelete(tenant)}
                                                disabled={processingId === tenant.id}
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
                    border: 1px solid hsl(var(--border));
                    background-color: transparent;
                    padding: 0.625rem 1rem; font-size: 0.875rem;
                    transition: all 0.2s; outline: none;
                }
                .input-modern:focus {
                    border-color: hsl(var(--primary) / 0.5);
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
