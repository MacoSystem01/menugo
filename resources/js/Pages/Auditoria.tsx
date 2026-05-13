import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

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
    filters: { action?: string; type?: string; causer?: string; fecha?: string };
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

function ActionBadge({ action }: { action: string }) {
    const cls = ACTION_STYLE[action] ?? 'bg-muted/30 text-muted-foreground border-border';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
            {action}
        </span>
    );
}

// ── Expansor de propiedades ────────────────────────────────────────────────────

function PropsDetail({ props }: { props: Record<string, unknown> | null }) {
    const [open, setOpen] = useState(false);
    if (!props) return <span className="text-muted-foreground/40 text-xs">—</span>;

    return (
        <div>
            <button
                onClick={() => setOpen(o => !o)}
                className="text-xs text-primary hover:underline underline-offset-2"
            >
                {open ? 'Ocultar' : 'Ver detalle'}
            </button>
            {open && (
                <pre className="mt-2 p-3 rounded-lg bg-muted/30 border border-border text-[11px] text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(props, null, 2)}
                </pre>
            )}
        </div>
    );
}

// ── Filtros ────────────────────────────────────────────────────────────────────

function Filters({ actions, types, filters }: { actions: string[]; types: string[]; filters: Props['filters'] }) {
    const [form, setForm] = useState({
        action: filters.action ?? '',
        type:   filters.type   ?? '',
        causer: filters.causer ?? '',
        fecha:  filters.fecha  ?? '',
    });

    function apply(e: React.FormEvent) {
        e.preventDefault();
        const params: Record<string, string> = {};
        if (form.action) params.action = form.action;
        if (form.type)   params.type   = form.type;
        if (form.causer) params.causer = form.causer;
        if (form.fecha)  params.fecha  = form.fecha;
        router.get('/auditoria', params, { preserveState: true });
    }

    function clear() {
        setForm({ action: '', type: '', causer: '', fecha: '' });
        router.get('/auditoria', {}, { preserveState: false });
    }

    const inputCls = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

    return (
        <form onSubmit={apply} className="bg-card border border-border rounded-2xl p-4 mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
                <label className="block text-xs text-muted-foreground mb-1">Acción</label>
                <select className={inputCls} value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}>
                    <option value="">Todas</option>
                    {actions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs text-muted-foreground mb-1">Tipo</label>
                <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="">Todos</option>
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs text-muted-foreground mb-1">Usuario</label>
                <input type="text" placeholder="Nombre..." className={inputCls}
                    value={form.causer} onChange={e => setForm(f => ({ ...f, causer: e.target.value }))} />
            </div>
            <div>
                <label className="block text-xs text-muted-foreground mb-1">Fecha</label>
                <input type="date" className={inputCls}
                    value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>
            <div className="col-span-2 lg:col-span-4 flex gap-2 justify-end">
                <button type="button" onClick={clear}
                    className="px-4 py-2 rounded-lg text-sm text-muted-foreground border border-border hover:bg-accent/10 transition-colors">
                    Limpiar
                </button>
                <button type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    Filtrar
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
                            dangerouslySetInnerHTML={{ __html: link.label }}
                          />
                        : <span key={i} className="px-3 py-1.5 text-muted-foreground/40"
                            dangerouslySetInnerHTML={{ __html: link.label }} />
                ))}
            </div>
        </div>
    );
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function Auditoria({ logs, actions, types, filters }: Props) {
    return (
        <AppShell title="Auditoría" subtitle="Registro completo de movimientos del sistema">
            <Head title="Auditoría" />

            <Filters actions={actions} types={types} filters={filters} />

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
                                <th className="px-4 py-3 text-left w-28">Detalle</th>
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
                                    <td className="px-4 py-3 text-foreground">{log.description}</td>
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
