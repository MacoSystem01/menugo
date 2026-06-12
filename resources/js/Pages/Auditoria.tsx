import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

function decodePaginationLabel(label: string): string {
    return label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»').replace(/&amp;/g, '&');
}

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface AuditEntry {
    id: number;
    action: string;
    auditable_type: string;
    auditable_id: number | string;
    description: string;
    causer_name: string;
    properties: Record<string, unknown> | null;
    created_at: string;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    logs: Paginated<AuditEntry>;
    actions: string[];
    types: string[];
    tables: { id: number; number: number }[];
    filters: { action?: string; type?: string; causer?: string; fecha?: string; table_id?: string };
}

// ── Badges ─────────────────────────────────────────────────────────────────────

const ACTION_STYLE: Record<string, string> = {
    create:  'bg-green-500/15 text-green-400 border-green-500/20',
    update:  'bg-blue-500/15 text-blue-400 border-blue-500/20',
    delete:  'bg-red-500/15 text-red-400 border-red-500/20',
    login:   'bg-purple-500/15 text-purple-400 border-purple-500/20',
    logout:  'bg-slate-500/15 text-slate-400 border-slate-500/20',
    payment: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    cancel:  'bg-orange-500/15 text-orange-400 border-orange-500/20',
    status:  'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    assign:  'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
    verify:  'bg-teal-500/15 text-teal-400 border-teal-500/20',
};

const ACTION_ES: Record<string, string> = {
    create:  'creación',
    update:  'actualización',
    delete:  'eliminación',
    login:   'ingreso',
    logout:  'salida',
    payment: 'pago',
    cancel:  'cancelación',
    status:  'cambio estado',
    assign:  'asignación',
    verify:  'verificación',
};

function ActionBadge({ action }: { action: string }) {
    const cls = ACTION_STYLE[action] ?? 'bg-muted/30 text-muted-foreground border-border';
    const label = ACTION_ES[action] ?? action;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
            {label}
        </span>
    );
}

const FIELD_TRANSLATIONS: Record<string, string> = {
    amount_paid:      'Monto pagado',
    cashier_id:       'Cajero (ID)',
    cook_id:          'Cocinero (ID)',
    delivery_user_id: 'Repartidor (ID)',
    status:           'Estado',
    name:             'Nombre',
    customer_name:    'Cliente',
    customer_phone:   'Teléfono Cliente',
    phone:            'Teléfono',
    price:            'Precio',
    description:      'Descripción',
    available:        'Disponible',
    image_url:        'Imagen (URL)',
    category_id:      'Categoría (ID)',
    email:            'Correo electrónico',
    role:             'Rol',
    password:         'Contraseña',
    active:           'Activo',
    table_id:         'Mesa (ID)',
    total:            'Total',
    payment_method:   'Método de pago',
    delivery_address: 'Dirección de entrega',
    notes:            'Notas',
};

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return 'Vacío';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

function PropsDetail({ props }: { props: Record<string, unknown> | null }) {
    const [open, setOpen] = useState(false);
    
    if (!props || Object.keys(props).length === 0) return <span className="text-muted-foreground/40 text-xs">—</span>;

    const oldValues = (props.old as Record<string, unknown>) || {};
    const newValues = (props.new as Record<string, unknown>) || (props.attributes as Record<string, unknown>) || {};
    const hasChanges = 'old' in props || 'new' in props || 'attributes' in props;

    const renderPlainData = (data: Record<string, unknown>) => {
        const keys = Object.keys(data).filter(k => data[k] !== undefined);
        if (keys.length === 0) return null;
        return (
            <ul className="space-y-1.5 mt-2 p-3 rounded-xl bg-card border border-border text-xs text-muted-foreground shadow-sm">
                {keys.map(k => (
                    <li key={k} className="flex flex-col gap-0.5">
                        <strong className="text-foreground/80 font-semibold">{FIELD_TRANSLATIONS[k] ?? k}:</strong> 
                        <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-foreground inline-block w-fit">{formatValue(data[k])}</span>
                    </li>
                ))}
            </ul>
        );
    };

    const renderChanges = () => {
        const allKeys = Array.from(new Set([...Object.keys(oldValues), ...Object.keys(newValues)]));
        if (allKeys.length === 0) return null;
        return (
            <div className="mt-2 p-3 rounded-xl bg-card border border-border text-xs space-y-3 shadow-sm">
                {allKeys.map(key => {
                    const label = FIELD_TRANSLATIONS[key] ?? key;
                    const oldVal = formatValue(oldValues[key]);
                    const newVal = formatValue(newValues[key]);
                    
                    return (
                        <div key={key} className="flex flex-col gap-1">
                            <span className="font-semibold text-foreground/80">{label}</span>
                            <div className="flex flex-wrap items-center gap-2">
                                {key in oldValues && (
                                    <span className="line-through text-red-400/80 bg-red-500/10 px-1.5 py-0.5 rounded font-mono break-all">{oldVal}</span>
                                )}
                                {key in oldValues && key in newValues && (
                                    <span className="text-muted-foreground">→</span>
                                )}
                                {key in newValues && (
                                    <span className="text-green-600 dark:text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded font-mono font-medium break-all">{newVal}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div>
            <button
                onClick={() => setOpen(o => !o)}
                className="text-xs text-primary font-medium hover:underline underline-offset-2 transition-all"
            >
                {open ? 'Ocultar' : 'Ver detalle'}
            </button>
            {open && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    {hasChanges ? renderChanges() : renderPlainData(props)}
                </div>
            )}
        </div>
    );
}

// ── Filtros ────────────────────────────────────────────────────────────────────

function Filters({ actions, types, tables, filters }: { actions: string[]; types: string[]; tables: { id: number; number: number }[]; filters: Props['filters'] }) {
    const [form, setForm] = useState({
        action: filters.action ?? '',
        type:   filters.type   ?? '',
        causer: filters.causer ?? '',
        fecha:  filters.fecha  ?? '',
        table_id: filters.table_id ?? '',
    });

    function apply(e: React.FormEvent) {
        e.preventDefault();
        const params: Record<string, string> = {};
        if (form.action) params.action = form.action;
        if (form.type)   params.type   = form.type;
        if (form.causer) params.causer = form.causer;
        if (form.fecha)  params.fecha  = form.fecha;
        if (form.type === 'Mesa' && form.table_id) params.table_id = form.table_id;
        router.get('/auditoria', params, { preserveState: true });
    }

    function clear() {
        setForm({ action: '', type: '', causer: '', fecha: '', table_id: '' });
        router.get('/auditoria', {}, { preserveState: false });
    }

    const inputCls = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow';

    return (
        <form onSubmit={apply} className="bg-card border border-border rounded-2xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Acción</label>
                <select className={inputCls} value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}>
                    <option value="">Todas</option>
                    {actions.map(a => <option key={a} value={a}>{ACTION_ES[a] ?? a}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tipo</label>
                <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, table_id: !['Mesa', 'Pedido'].includes(e.target.value) ? '' : f.table_id }))}>
                    <option value="">Todos</option>
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            {(form.type === 'Mesa' || form.type === 'Pedido') && (
                <div className="animate-in fade-in zoom-in duration-200 col-span-1">
                    <label className="block text-xs font-medium text-primary mb-1.5">Mesa específica</label>
                    <select className={`${inputCls} border-primary/40 ring-1 ring-primary/20`} value={form.table_id} onChange={e => setForm(f => ({ ...f, table_id: e.target.value }))}>
                        <option value="">Todas las Mesas</option>
                        {tables.map(t => <option key={t.id} value={t.id}>Mesa #{t.number}</option>)}
                    </select>
                </div>
            )}
            <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Usuario</label>
                <input type="text" placeholder="Nombre..." className={inputCls}
                    value={form.causer} onChange={e => setForm(f => ({ ...f, causer: e.target.value }))} />
            </div>
            <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Fecha</label>
                <input type="date" className={inputCls}
                    value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>
            <div className="col-span-1 sm:col-span-full flex gap-3 justify-end mt-2">
                <button type="button" onClick={clear}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground border border-border hover:bg-accent/10 hover:text-foreground transition-colors">
                    Limpiar
                </button>
                <button type="submit"
                    className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                    Aplicar Filtros
                </button>
            </div>
        </form>
    );
}

// ── Paginación ─────────────────────────────────────────────────────────────────

function Pagination({ logs }: { logs: Paginated<AuditEntry> }) {
    if (logs.last_page <= 1) return null;

    return (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>
                Mostrando {(logs.current_page - 1) * logs.per_page + 1}–{Math.min(logs.current_page * logs.per_page, logs.total)} de {logs.total}
            </span>
            <div className="flex gap-1">
                {logs.links.map((link, i) => (
                    link.url
                        ? <button key={i}
                            onClick={() => router.get(link.url!, {}, { preserveState: true })}
                            className={`px-3 py-1.5 rounded-lg border transition-colors ${
                                link.active
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'border-border hover:bg-accent/10'
                            }`}
                          >{decodePaginationLabel(link.label)}</button>
                        : <span key={i} className="px-3 py-1.5 text-muted-foreground/40"
                          >{decodePaginationLabel(link.label)}</span>
                ))}
            </div>
        </div>
    );
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function Auditoria({ logs, actions, types, tables, filters }: Props) {
    return (
        <AppShell title="Auditoría" subtitle="Registro completo de movimientos del sistema">
            <Head title="Auditoría" />

            <Filters actions={actions} types={types} tables={tables} filters={filters} />

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/20 text-xs text-muted-foreground uppercase tracking-wide">
                                <th className="px-4 py-3 text-left w-36">Fecha/Hora</th>
                                <th className="px-4 py-3 text-left w-24">Acción</th>
                                <th className="px-4 py-3 text-left w-24">Tipo</th>
                                <th className="px-4 py-3 text-left">Descripción</th>
                                <th className="px-4 py-3 text-left w-36">Usuario</th>
                                <th className="px-4 py-3 text-left w-32">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {logs.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                                        No hay registros para los filtros aplicados.
                                    </td>
                                </tr>
                            )}
                            {logs.data.map(log => (
                                <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap font-mono">
                                        {log.created_at}
                                    </td>
                                    <td className="px-4 py-3">
                                        <ActionBadge action={log.action} />
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        {log.auditable_type}
                                        <span className="ml-1 opacity-50">#{log.auditable_id}</span>
                                    </td>
                                    <td className="px-4 py-3 text-foreground font-medium">{log.description}</td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">{log.causer_name}</td>
                                    <td className="px-4 py-3">
                                        <PropsDetail props={log.properties} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination logs={logs} />
        </AppShell>
    );
}
