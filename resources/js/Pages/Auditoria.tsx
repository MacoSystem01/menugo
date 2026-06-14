import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

function decodePaginationLabel(label: string): string {
    return label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»').replace(/&amp;/g, '&');
}

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface AuditEntry {
    id:             number;
    action:         string;
    auditable_type: string;
    auditable_id:   number | string;
    description:    string;
    causer_name:    string;
    properties:     Record<string, unknown> | null;
    created_at:     string;
}

interface Paginated<T> {
    data:         T[];
    current_page: number;
    last_page:    number;
    per_page:     number;
    total:        number;
    links:        { url: string | null; label: string; active: boolean }[];
}

interface Props {
    logs:    Paginated<AuditEntry>;
    actions: string[];
    types:   string[];
    tables:  { id: number; number: number }[];
    filters: { action?: string; type?: string; causer?: string; fecha?: string; table_id?: string };
}

// ── Traducciones ───────────────────────────────────────────────────────────────

const ACTION_ES: Record<string, string> = {
    create:  'Creación',
    update:  'Actualización',
    delete:  'Eliminación',
    login:   'Ingreso',
    logout:  'Salida',
    payment: 'Pago',
    cancel:  'Cancelación',
    status:  'Cambio estado',
    assign:  'Asignación',
    verify:  'Verificación',
};

const FIELD_TRANSLATIONS: Record<string, string> = {
    amount_paid:       'Monto pagado',
    cashier_id:        'Cajero (ID)',
    cook_id:           'Cocinero (ID)',
    delivery_user_id:  'Repartidor (ID)',
    status:            'Estado',
    name:              'Nombre',
    customer_name:     'Cliente',
    customer_phone:    'Teléfono cliente',
    phone:             'Teléfono',
    price:             'Precio',
    description:       'Descripción',
    available:         'Disponible',
    image_url:         'Imagen (URL)',
    category_id:       'Categoría (ID)',
    email:             'Correo electrónico',
    role:              'Rol',
    password:          'Contraseña',
    active:            'Activo',
    table_id:          'Mesa (ID)',
    total:             'Total',
    payment_method:    'Método de pago',
    delivery_address:  'Dirección de entrega',
    notes:             'Notas',
};

// ── Badge de acción — 3 variantes neutrales ────────────────────────────────────

type BadgeVariant = 'default' | 'emphasis' | 'destructive';

const ACTION_VARIANT: Record<string, BadgeVariant> = {
    create:  'emphasis',
    payment: 'emphasis',
    delete:  'destructive',
    cancel:  'destructive',
};

const BADGE_CLS: Record<BadgeVariant, string> = {
    default:     'bg-muted/60 text-muted-foreground border-border/60',
    emphasis:    'bg-foreground/5 text-foreground/80 border-foreground/15',
    destructive: 'bg-red-500/8 text-red-500/75 border-red-500/15',
};

function ActionBadge({ action }: { action: string }) {
    const variant = ACTION_VARIANT[action] ?? 'default';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${BADGE_CLS[variant]}`}>
            {ACTION_ES[action] ?? action}
        </span>
    );
}

// ── Detalle de propiedades ─────────────────────────────────────────────────────

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

function PropsDetail({ props }: { props: Record<string, unknown> | null }) {
    const [open, setOpen] = useState(false);

    if (!props || Object.keys(props).length === 0) {
        return <span className="text-muted-foreground/30 text-xs">—</span>;
    }

    const oldValues  = (props.old as Record<string, unknown>) || {};
    const newValues  = (props.new as Record<string, unknown>) || (props.attributes as Record<string, unknown>) || {};
    const hasChanges = 'old' in props || 'new' in props || 'attributes' in props;

    const renderPlain = (data: Record<string, unknown>) => {
        const keys = Object.keys(data).filter(k => data[k] !== undefined);
        if (keys.length === 0) return null;
        return (
            <div className="mt-2 rounded-xl border border-border bg-card p-3 space-y-1.5">
                {keys.map(k => (
                    <div key={k} className="flex items-start gap-2 text-xs">
                        <span className="text-muted-foreground shrink-0 w-28">{FIELD_TRANSLATIONS[k] ?? k}</span>
                        <span className="font-mono text-foreground/80 break-all">{formatValue(data[k])}</span>
                    </div>
                ))}
            </div>
        );
    };

    const renderChanges = () => {
        const allKeys = Array.from(new Set([...Object.keys(oldValues), ...Object.keys(newValues)]));
        if (allKeys.length === 0) return null;
        return (
            <div className="mt-2 rounded-xl border border-border bg-card p-3 space-y-2.5">
                {allKeys.map(key => {
                    const label  = FIELD_TRANSLATIONS[key] ?? key;
                    const oldVal = formatValue(oldValues[key]);
                    const newVal = formatValue(newValues[key]);
                    return (
                        <div key={key} className="text-xs">
                            <span className="text-muted-foreground/70 block mb-1">{label}</span>
                            <div className="flex flex-wrap items-center gap-2">
                                {key in oldValues && (
                                    <span className="font-mono text-muted-foreground line-through break-all">{oldVal}</span>
                                )}
                                {key in oldValues && key in newValues && (
                                    <span className="text-muted-foreground/40 text-[10px]">→</span>
                                )}
                                {key in newValues && (
                                    <span className="font-mono text-foreground font-medium break-all">{newVal}</span>
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
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 decoration-dotted transition-colors"
            >
                {open ? 'Ocultar' : 'Ver detalle'}
            </button>
            {open && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                    {hasChanges ? renderChanges() : renderPlain(props)}
                </div>
            )}
        </div>
    );
}

// ── Filtros ────────────────────────────────────────────────────────────────────

function Filters({
    actions, types, tables, filters,
}: {
    actions: string[];
    types:   string[];
    tables:  { id: number; number: number }[];
    filters: Props['filters'];
}) {
    const [form, setForm] = useState({
        action:   filters.action   ?? '',
        type:     filters.type     ?? '',
        causer:   filters.causer   ?? '',
        fecha:    filters.fecha    ?? '',
        table_id: filters.table_id ?? '',
    });

    function apply(e: React.FormEvent) {
        e.preventDefault();
        const params: Record<string, string> = {};
        if (form.action)   params.action   = form.action;
        if (form.type)     params.type     = form.type;
        if (form.causer)   params.causer   = form.causer;
        if (form.fecha)    params.fecha    = form.fecha;
        if (form.type === 'Mesa' && form.table_id) params.table_id = form.table_id;
        router.get('/auditoria', params, { preserveState: true });
    }

    function clear() {
        setForm({ action: '', type: '', causer: '', fecha: '', table_id: '' });
        router.get('/auditoria', {}, { preserveState: false });
    }

    const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow';

    return (
        <form
            onSubmit={apply}
            className="bg-card border border-border rounded-2xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
        >
            <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Acción</label>
                <select className={inputCls} value={form.action}
                    onChange={e => setForm(f => ({ ...f, action: e.target.value }))}>
                    <option value="">Todas</option>
                    {actions.map(a => (
                        <option key={a} value={a}>{ACTION_ES[a] ?? a}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tipo</label>
                <select className={inputCls} value={form.type}
                    onChange={e => setForm(f => ({
                        ...f,
                        type: e.target.value,
                        table_id: !['Mesa', 'Pedido'].includes(e.target.value) ? '' : f.table_id,
                    }))}>
                    <option value="">Todos</option>
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {(form.type === 'Mesa' || form.type === 'Pedido') && (
                <div className="animate-in fade-in zoom-in duration-150">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Mesa específica</label>
                    <select className={inputCls} value={form.table_id}
                        onChange={e => setForm(f => ({ ...f, table_id: e.target.value }))}>
                        <option value="">Todas las mesas</option>
                        {tables.map(t => (
                            <option key={t.id} value={t.id}>Mesa #{t.number}</option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Usuario</label>
                <input
                    type="text"
                    placeholder="Buscar por nombre…"
                    className={inputCls}
                    value={form.causer}
                    onChange={e => setForm(f => ({ ...f, causer: e.target.value }))}
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Fecha</label>
                <input
                    type="date"
                    className={inputCls}
                    value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                />
            </div>

            <div className="col-span-1 sm:col-span-full flex gap-2 justify-end mt-1">
                <button
                    type="button"
                    onClick={clear}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground border border-border hover:bg-muted/30 hover:text-foreground transition-colors"
                >
                    Limpiar
                </button>
                <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    Aplicar
                </button>
            </div>
        </form>
    );
}

// ── Paginación ─────────────────────────────────────────────────────────────────

function Pagination({ logs }: { logs: Paginated<AuditEntry> }) {
    if (logs.last_page <= 1) return null;

    return (
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span>
                Mostrando {(logs.current_page - 1) * logs.per_page + 1}–{Math.min(logs.current_page * logs.per_page, logs.total)} de {logs.total} registros
            </span>
            <div className="flex gap-1">
                {logs.links.map((link, i) =>
                    link.url ? (
                        <button
                            key={i}
                            onClick={() => router.get(link.url!, {}, { preserveState: true })}
                            className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                                link.active
                                    ? 'bg-foreground text-background border-foreground font-semibold'
                                    : 'border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {decodePaginationLabel(link.label)}
                        </button>
                    ) : (
                        <span key={i} className="px-3 py-1.5 text-muted-foreground/30">
                            {decodePaginationLabel(link.label)}
                        </span>
                    )
                )}
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

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Encabezado de totales */}
                {logs.total > 0 && (
                    <div className="px-5 py-3 border-b border-border bg-muted/10 flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                            Registro de actividad
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {logs.total} {logs.total === 1 ? 'entrada' : 'entradas'}
                        </span>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                <th className="px-5 py-3 text-left w-36">Fecha / Hora</th>
                                <th className="px-5 py-3 text-left w-28">Acción</th>
                                <th className="px-5 py-3 text-left w-28 hidden sm:table-cell">Tipo</th>
                                <th className="px-5 py-3 text-left">Descripción</th>
                                <th className="px-5 py-3 text-left w-36 hidden md:table-cell">Usuario</th>
                                <th className="px-5 py-3 text-left w-28">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {logs.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                                        No hay registros para los filtros aplicados.
                                    </td>
                                </tr>
                            )}
                            {logs.data.map(log => (
                                <tr key={log.id} className="hover:bg-muted/5 transition-colors">
                                    <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap font-mono">
                                        {log.created_at}
                                    </td>
                                    <td className="px-5 py-3">
                                        <ActionBadge action={log.action} />
                                    </td>
                                    <td className="px-5 py-3 text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                                        {log.auditable_type}
                                        <span className="ml-1 opacity-40">#{log.auditable_id}</span>
                                    </td>
                                    <td className="px-5 py-3 text-foreground/80 font-medium">
                                        {log.description}
                                    </td>
                                    <td className="px-5 py-3 text-xs text-muted-foreground hidden md:table-cell">
                                        {log.causer_name}
                                    </td>
                                    <td className="px-5 py-3">
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
