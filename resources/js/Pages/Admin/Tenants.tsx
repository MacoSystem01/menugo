import AppShell from '@/Layouts/AppShell';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Power, Trash2, ExternalLink, Mail, Calendar, ShieldCheck, ShieldAlert } from 'lucide-react';

interface Tenant {
    id: string;
    name: string;
    email: string;
    plan: string;
    active: boolean;
    subdomain: string;
    expires_at: string | null;
    created_at: string;
}

interface Props {
    tenants: Tenant[];
}

const PLAN_LABELS: Record<string, string> = {
    basico: 'Básico',
    pro: 'Pro',
    enterprise: 'Enterprise',
    mensual: 'Mensual',
    trimestral: 'Trimestral',
    semestral: 'Semestral',
    anual: 'Anual',
};

const PLAN_COLORS: Record<string, string> = {
    basico: 'bg-zinc-100 text-zinc-700',
    pro: 'bg-blue-100 text-blue-700',
    enterprise: 'bg-amber-100 text-amber-700',
    anual: 'bg-indigo-100 text-indigo-700',
};

export default function Tenants({ tenants }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        subdomain: '',
        plan: 'basico',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/tenants', {
            onSuccess: () => { reset(); setShowForm(false); },
        });
    }

    function handleDelete(tenant: any) {
        let message = `¿Estás seguro de eliminar permanentemente el local "${tenant.name}"?`;
        
        if (tenant.active && !tenant.expires_at) {
            message = `⚠️ ATENCIÓN: El local "${tenant.name}" se encuentra ACTIVO y sin fecha de vencimiento configurada. \n\n¿Realmente deseas eliminarlo por completo? Esta acción es irreversible.`;
        } else if (tenant.active) {
            message = `El local "${tenant.name}" está ACTIVO. ¿Deseas eliminarlo permanentemente?`;
        }

        if (!confirm(message)) return;
        
        setProcessingId(tenant.id);
        router.delete(`/admin/tenants/${tenant.id}`, {
            onFinish: () => setProcessingId(null),
        });
    }

    function toggleStatus(id: string) {
        setProcessingId(id);
        router.patch(`/admin/tenants/${id}/status`, {}, {
            onFinish: () => setProcessingId(null),
        });
    }

    return (
        <AppShell title="Gestión de Locales" subtitle="Administración global de tenants y acceso" variant="admin">
            <Head title="SuperAdmin - Restaurantes" />

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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field label="Nombre del Negocio" error={errors.name}>
                                <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                                    placeholder="Ej. Parrilla Don Juan" className="input-modern" />
                            </Field>

                            <Field label="Email Administrativo" error={errors.email}>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                        placeholder="admin@ejemplo.com" className="input-modern pl-10" />
                                </div>
                            </Field>

                            <Field label="Subdominio" error={errors.subdomain} hint="Solo minúsculas, sin espacios ni caracteres especiales.">
                                <div className="flex items-center rounded-xl border border-border bg-muted/20 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/40 transition-all overflow-hidden">
                                    <input type="text" value={data.subdomain} onChange={e => setData('subdomain', e.target.value.toLowerCase())}
                                        placeholder="mi-negocio" className="flex-1 px-4 py-2.5 bg-transparent text-sm outline-none font-semibold" />
                                    <span className="px-4 py-2.5 bg-muted text-muted-foreground text-xs font-bold border-l border-border select-none">.Menugo.local</span>
                                </div>
                            </Field>

                            <Field label="Plan Inicial" error={errors.plan}>
                                <select value={data.plan} onChange={e => setData('plan', e.target.value)} className="input-modern appearance-none">
                                    <option value="basico">Básico (Mensual)</option>
                                    <option value="pro">Pro (Trimestral)</option>
                                    <option value="enterprise">Enterprise (Anual)</option>
                                </select>
                            </Field>
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
                                <th className="text-left px-6 py-5 font-bold">Identificación / Email</th>
                                <th className="text-left px-6 py-5 font-bold">Acceso Directo</th>
                                <th className="text-left px-6 py-5 font-bold">Estado</th>
                                <th className="text-left px-6 py-5 font-bold">Suscripción</th>
                                <th className="text-right px-6 py-5 font-bold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tenants.map(tenant => (
                                <tr key={tenant.id} className="group hover:bg-muted/20 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 border border-zinc-300 flex items-center justify-center font-display font-bold text-zinc-600">
                                                {tenant.name[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-foreground">{tenant.name}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {tenant.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <a href={`http://${tenant.subdomain}`} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition-colors">
                                            {tenant.subdomain}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </td>
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
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded w-fit font-bold uppercase tracking-tight ${PLAN_COLORS[tenant.plan] ?? 'bg-zinc-100 text-zinc-700'}`}>
                                                {PLAN_LABELS[tenant.plan] ?? tenant.plan}
                                            </span>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                                                <input 
                                                    type="date" 
                                                    defaultValue={tenant.expires_at?.split('T')[0] ?? ''}
                                                    onChange={(e) => {
                                                        router.put(`/admin/tenants/${tenant.id}`, { expires_at: e.target.value });
                                                    }}
                                                    className="text-[10px] bg-transparent border-none p-0 font-bold text-muted-foreground focus:ring-0 cursor-pointer hover:text-foreground transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-end gap-3">
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
                    width: 100%;
                    border-radius: 0.75rem;
                    border: 1px solid hsl(var(--border));
                    background-color: transparent;
                    padding: 0.625rem 1rem;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                    outline: none;
                }
                .input-modern:focus {
                    border-color: hsl(var(--primary) / 0.5);
                    ring: 4px;
                    ring-color: hsl(var(--primary) / 0.1);
                }
            `}</style>
        </AppShell>
    );
}

function Field({ label, error, hint, children }: {
    label: string;
    error?: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">{label}</label>
            {children}
            {hint && <p className="text-[10px] text-muted-foreground italic ml-1">{hint}</p>}
            {error && <p className="text-[10px] font-bold text-red-500 ml-1">× {error}</p>}
        </div>
    );
}
