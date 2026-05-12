import AppShell from '@/Layouts/AppShell';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

interface Tenant {
    id: string;
    name: string;
    email: string;
    plan: string;
    subdomain: string;
    created_at: string;
}

interface Props {
    tenants: Tenant[];
}

const PLAN_LABELS: Record<string, string> = {
    basico: 'Básico',
    pro: 'Pro',
    enterprise: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
    basico: 'bg-zinc-100 text-zinc-700',
    pro: 'bg-blue-100 text-blue-700',
    enterprise: 'bg-amber-100 text-amber-700',
};

export default function Tenants({ tenants }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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

    function handleDelete(id: string) {
        if (!confirm('¿Eliminar este restaurante? Se borrará su base de datos permanentemente.')) return;
        setDeletingId(id);
        router.delete(`/admin/tenants/${id}`, {
            onFinish: () => setDeletingId(null),
        });
    }

    return (
        <AppShell title="Restaurantes" variant="admin">
            <Head title="Restaurantes" />

            <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">{tenants.length} restaurante{tenants.length !== 1 ? 's' : ''} registrado{tenants.length !== 1 ? 's' : ''}</p>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    {showForm ? 'Cancelar' : '+ Nuevo restaurante'}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-border bg-card p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <h2 className="text-base font-semibold mb-1">Registrar nuevo restaurante</h2>
                        <p className="text-xs text-muted-foreground">Se creará una base de datos y subdominio automáticamente.</p>
                    </div>

                    <Field label="Nombre del restaurante" error={errors.name}>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="La Pizzeria"
                            className="input-base"
                        />
                    </Field>

                    <Field label="Email de contacto" error={errors.email}>
                        <input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            placeholder="info@restaurante.com"
                            className="input-base"
                        />
                    </Field>

                    <Field label="Subdominio" error={errors.subdomain} hint="Solo letras minúsculas, números y guiones">
                        <div className="flex items-center rounded-xl border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
                            <input
                                type="text"
                                value={data.subdomain}
                                onChange={e => setData('subdomain', e.target.value.toLowerCase())}
                                placeholder="la-pizzeria"
                                className="flex-1 px-3 py-2 bg-background text-sm outline-none"
                            />
                            <span className="px-3 py-2 bg-muted text-muted-foreground text-sm border-l border-border">.menugo.local</span>
                        </div>
                    </Field>

                    <Field label="Plan" error={errors.plan}>
                        <select
                            value={data.plan}
                            onChange={e => setData('plan', e.target.value)}
                            className="input-base"
                        >
                            <option value="basico">Básico</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </Field>

                    <div className="sm:col-span-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {processing ? 'Creando…' : 'Crear restaurante'}
                        </button>
                    </div>
                </form>
            )}

            {/* Table */}
            <div className="rounded-2xl border border-border overflow-hidden">
                {tenants.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground text-sm">
                        No hay restaurantes registrados aún.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Restaurante</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subdominio</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Creado</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tenants.map(tenant => (
                                <tr key={tenant.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="font-medium">{tenant.name}</p>
                                        <p className="text-xs text-muted-foreground">{tenant.email}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <code className="text-xs bg-muted rounded px-1.5 py-0.5">{tenant.subdomain}</code>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[tenant.plan] ?? 'bg-zinc-100 text-zinc-700'}`}>
                                            {PLAN_LABELS[tenant.plan] ?? tenant.plan}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{tenant.created_at}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(tenant.id)}
                                            disabled={deletingId === tenant.id}
                                            className="text-xs text-destructive hover:underline disabled:opacity-50"
                                        >
                                            {deletingId === tenant.id ? 'Eliminando…' : 'Eliminar'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
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
        <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{label}</label>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
