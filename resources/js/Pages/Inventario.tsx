import AppShell from '@/Layouts/AppShell';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Package, AlertTriangle, X } from 'lucide-react';
import type { PageProps } from '@/types';

interface InventoryItem {
    id: number;
    name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total_value: number;
    status: string;
    expiry_date: string | null;
    notes: string | null;
}

interface Resumen {
    total: number;
    ok: number;
    bajo: number;
    agotado: number;
    vencido: number;
}

interface Filters {
    status?: string;
}

interface PorVencer {
    id: number;
    name: string;
    expiry_date: string;
    dias: number;
}

interface Props {
    items: InventoryItem[];
    resumen: Resumen;
    filters: Filters;
    por_vencer: PorVencer[];
    flash?: { success?: string };
}

interface ItemForm {
    name: string; quantity: number | string;
    unit_price: number | string; status: string;
    expiry_date: string; notes: string;
}

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

const STATUS_LABEL: Record<string, string> = {
    ok:      'OK',
    bajo:    'Stock bajo',
    agotado: 'Agotado',
    vencido: 'Vencido',
};

const STATUS_CLASS: Record<string, string> = {
    ok:      'bg-accent/15 text-accent',
    bajo:    'bg-yellow-500/15 text-yellow-400',
    agotado: 'bg-red-500/15 text-red-400',
    vencido: 'bg-red-700/15 text-red-500',
};

export default function Inventario({ items, resumen, filters, por_vencer, flash }: Props) {
    const { auth } = usePage<PageProps>().props;
    const canSeeAlert = auth.user.roles.includes('administrador') || auth.user.roles.includes('gerente');

    const [showModal, setShowModal]   = useState(false);
    const [editing, setEditing]       = useState<InventoryItem | null>(null);
    const [statusFilter, setStatus]   = useState(filters.status ?? '');
    const [alertVisible, setAlert]    = useState(() =>
        canSeeAlert &&
        por_vencer.length > 0 &&
        sessionStorage.getItem('inv_venc_dismissed') !== new Date().toDateString()
    );

    function dismissAlert() {
        sessionStorage.setItem('inv_venc_dismissed', new Date().toDateString());
        setAlert(false);
    }

    const form = useForm<ItemForm>({
        name: '', quantity: '', unit_price: '', status: 'ok', expiry_date: '', notes: '',
    });

    function applyFilter(v: string) {
        setStatus(v);
        router.get('/inventario', v ? { status: v } : {}, { preserveState: true });
    }

    function openCreate() {
        form.reset();
        setEditing(null);
        setShowModal(true);
    }

    function openEdit(item: InventoryItem) {
        form.setData({
            name: item.name, quantity: item.quantity,
            unit_price: item.unit_price, status: item.status,
            expiry_date: item.expiry_date ?? '', notes: item.notes ?? '',
        });
        setEditing(item);
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        form.reset();
        setEditing(null);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            form.put(`/inventario/${editing.id}`, { onSuccess: closeModal });
        } else {
            form.post('/inventario', { onSuccess: closeModal });
        }
    }

    function handleDelete(item: InventoryItem) {
        if (!confirm(`¿Eliminar "${item.name}" del inventario?`)) return;
        router.delete(`/inventario/${item.id}`);
    }

    const kpis = [
        { label: 'Total productos', value: resumen.total, color: 'bg-primary/10 text-primary' },
        { label: 'Stock OK',         value: resumen.ok,    color: 'bg-accent/10 text-accent' },
        { label: 'Stock bajo',       value: resumen.bajo,  color: 'bg-yellow-500/10 text-yellow-400' },
        { label: 'Agotado/Vencido',  value: resumen.agotado + resumen.vencido, color: 'bg-red-500/10 text-red-400' },
    ];

    return (
        <AppShell title="Inventario" subtitle="Control de stock y productos">
            <Head title="Inventario" />

            {flash?.success && (
                <div className="mb-4 rounded-xl bg-accent/15 border border-accent/30 text-accent px-4 py-3 text-sm">{flash.success}</div>
            )}

            {/* Alerta de productos por vencer */}
            {alertVisible && (
                <div className="mb-5 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                            <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-yellow-400 mb-1">
                                    {por_vencer.length === 1
                                        ? 'Un producto está por vencer'
                                        : `${por_vencer.length} productos están por vencer`}
                                </p>
                                <ul className="space-y-0.5">
                                    {por_vencer.map(p => (
                                        <li key={p.id} className="text-xs text-yellow-300/80">
                                            <span className="font-medium">{p.name}</span>
                                            {' — vence el '}{p.expiry_date}
                                            {p.dias === 0
                                                ? ' (hoy)'
                                                : p.dias === 1
                                                    ? ' (mañana)'
                                                    : ` (en ${p.dias} días)`}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <button onClick={dismissAlert} className="shrink-0 text-yellow-400/60 hover:text-yellow-400 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                {kpis.map(kpi => (
                    <div key={kpi.label} className={`rounded-2xl border border-border bg-card p-5`}>
                        <div className="text-xs text-muted-foreground mb-2">{kpi.label}</div>
                        <div className={`font-display text-3xl font-bold ${kpi.color.split(' ')[1]}`}>{kpi.value}</div>
                    </div>
                ))}
            </div>

            {/* Controles */}
            <div className="flex flex-wrap gap-3 justify-between mb-6">
                <div className="flex gap-2 flex-wrap">
                    {['', 'ok', 'bajo', 'agotado', 'vencido'].map(v => (
                        <button
                            key={v}
                            onClick={() => applyFilter(v)}
                            className={`h-8 px-3 rounded-xl text-xs font-medium transition-colors ${statusFilter === v ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted text-muted-foreground'}`}
                        >
                            {v ? STATUS_LABEL[v] : 'Todos'}
                        </button>
                    ))}
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Plus className="h-4 w-4" /> Agregar producto
                </button>
            </div>

            {/* Tabla */}
            {items.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center">
                    <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Sin productos</p>
                    <p className="text-sm text-muted-foreground mt-1">Registra los productos de tu inventario.</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="text-xs uppercase text-muted-foreground bg-muted/30 border-b border-border">
                            <tr>
                                <th className="text-left px-6 py-3 font-medium">Producto</th>
                                <th className="text-right px-6 py-3 font-medium">Cantidad</th>
                                <th className="text-right px-6 py-3 font-medium hidden md:table-cell">Precio unit.</th>
                                <th className="text-right px-6 py-3 font-medium hidden md:table-cell">Valor total</th>
                                <th className="text-center px-6 py-3 font-medium">Estado</th>
                                <th className="text-right px-6 py-3 font-medium hidden lg:table-cell">Vencimiento</th>
                                <th className="text-right px-6 py-3 font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{item.name}</div>
                                        {item.notes && <div className="text-xs text-muted-foreground mt-0.5">{item.notes}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold">{item.quantity} <span className="font-normal text-muted-foreground text-xs">{item.unit}</span></td>
                                    <td className="px-6 py-4 text-right hidden md:table-cell">{fmt(item.unit_price)}</td>
                                    <td className="px-6 py-4 text-right hidden md:table-cell font-semibold">{fmt(item.total_value)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_CLASS[item.status] ?? 'bg-muted text-muted-foreground'}`}>
                                            {STATUS_LABEL[item.status] ?? item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-muted-foreground hidden lg:table-cell">
                                        {item.expiry_date ? new Date(item.expiry_date + 'T12:00').toLocaleDateString('es-CO') : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="inline-flex gap-2">
                                            <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(item)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 className="font-display text-lg font-bold mb-5">{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Nombre <span className="text-red-400">*</span></label>
                                <input className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={form.data.name} onChange={e => form.setData('name', e.target.value)} placeholder="Ej: Harina de trigo" autoFocus />
                                {form.errors.name && <p className="text-xs text-red-400 mt-1">{form.errors.name}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Cantidad <span className="text-red-400">*</span></label>
                                    <input type="number" min={0} step={0.001}
                                        className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        value={form.data.quantity} onChange={e => form.setData('quantity', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Precio unit. <span className="text-red-400">*</span></label>
                                    <input type="number" min={0} step={0.01}
                                        className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        value={form.data.unit_price} onChange={e => form.setData('unit_price', e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Estado <span className="text-red-400">*</span></label>
                                <select className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={form.data.status} onChange={e => form.setData('status', e.target.value)}>
                                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Fecha de vencimiento</label>
                                <input type="date" className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={form.data.expiry_date} onChange={e => form.setData('expiry_date', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Notas</label>
                                <input className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={form.data.notes} onChange={e => form.setData('notes', e.target.value)} placeholder="Observaciones..." />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                                <button type="submit" disabled={form.processing} className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60">
                                    {form.processing ? 'Guardando...' : editing ? 'Guardar cambios' : 'Agregar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
