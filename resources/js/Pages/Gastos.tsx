import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Receipt, Plus, Trash2, Filter, X, TrendingDown } from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Gasto {
    id:             number;
    descripcion:    string;
    monto:          number;
    categoria:      string;
    fecha:          string;
    notas:          string | null;
    registrado_por: string | null;
    created_at:     string;
}

interface Props {
    gastos:        Gasto[];
    totalFiltrado: number;
    filters:       { categoria?: string; fecha_desde?: string; fecha_hasta?: string };
    flash?:        { success?: string; error?: string };
}

const CATEGORIAS = [
    { value: 'general',         label: 'General' },
    { value: 'insumos',         label: 'Insumos' },
    { value: 'servicios',       label: 'Servicios' },
    { value: 'nomina',          label: 'Nómina' },
    { value: 'mantenimiento',   label: 'Mantenimiento' },
    { value: 'arriendo',        label: 'Arriendo' },
    { value: 'transporte',      label: 'Transporte' },
    { value: 'publicidad',      label: 'Publicidad' },
    { value: 'equipos',         label: 'Equipos' },
    { value: 'otros',           label: 'Otros' },
];

const fmt = (n: number) =>
    n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

function localDateStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const CATEGORIA_COLORS: Record<string, string> = {
    insumos:       'bg-blue-500/10 text-blue-400',
    servicios:     'bg-purple-500/10 text-purple-400',
    nomina:        'bg-amber-500/10 text-amber-400',
    mantenimiento: 'bg-orange-500/10 text-orange-400',
    arriendo:      'bg-red-500/10 text-red-400',
    transporte:    'bg-cyan-500/10 text-cyan-400',
    publicidad:    'bg-pink-500/10 text-pink-400',
    equipos:       'bg-indigo-500/10 text-indigo-400',
    otros:         'bg-muted text-muted-foreground',
    general:       'bg-muted text-muted-foreground',
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function Gastos({ gastos, totalFiltrado, filters, flash }: Props) {
    const [showForm,    setShowForm]    = useState(false);
    const [deleting,    setDeleting]    = useState<number | null>(null);
    const [submitting,  setSubmitting]  = useState(false);

    const [form, setForm] = useState({
        descripcion: '',
        monto:       '',
        categoria:   'general',
        fecha:       localDateStr(),
        notas:       '',
    });

    const [filterForm, setFilterForm] = useState({
        categoria:   filters.categoria   ?? '',
        fecha_desde: filters.fecha_desde ?? '',
        fecha_hasta: filters.fecha_hasta ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        router.post('/gastos', form, {
            onSuccess: () => {
                setForm({ descripcion: '', monto: '', categoria: 'general', fecha: localDateStr(), notas: '' });
                setShowForm(false);
            },
            onFinish: () => setSubmitting(false),
        });
    }

    function handleDelete(id: number) {
        setDeleting(id);
        router.delete(`/gastos/${id}`, {
            onFinish: () => setDeleting(null),
        });
    }

    function applyFilters() {
        router.get('/gastos', filterForm, { preserveState: true, replace: true });
    }

    function clearFilters() {
        setFilterForm({ categoria: '', fecha_desde: '', fecha_hasta: '' });
        router.get('/gastos', {}, { preserveState: false, replace: true });
    }

    const hasFilters = filterForm.categoria || filterForm.fecha_desde || filterForm.fecha_hasta;

    return (
        <AppShell title="Gastos" subtitle="Registra y controla los gastos del restaurante">
            <Head title="Gastos" />

            <div className="max-w-4xl space-y-5">

                {flash?.success && (
                    <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
                        {flash.success}
                    </div>
                )}

                {/* Tarjeta de total + botón nuevo */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3.5">
                        <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                            <TrendingDown className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total gastos</p>
                            <p className="text-lg font-bold text-foreground">{fmt(totalFiltrado)}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowForm(v => !v)}
                        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Registrar gasto
                    </button>
                </div>

                {/* Formulario nuevo gasto */}
                {showForm && (
                    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-primary" />
                                Nuevo gasto
                            </p>
                            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Descripción *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.descripcion}
                                        onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                                        placeholder="Ej: Compra de aceite de cocina"
                                        className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Monto *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0.01"
                                        step="any"
                                        value={form.monto}
                                        onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                                        placeholder="0"
                                        className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Categoría *</label>
                                    <select
                                        value={form.categoria}
                                        onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                                        className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        {CATEGORIAS.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Fecha *</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.fecha}
                                        onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                                        className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Notas (opcional)</label>
                                    <textarea
                                        rows={2}
                                        value={form.notas}
                                        onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                                        placeholder="Detalles adicionales..."
                                        className="w-full rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Guardando...' : 'Guardar gasto'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Filtros */}
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        Filtrar gastos
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <select
                            value={filterForm.categoria}
                            onChange={e => setFilterForm(f => ({ ...f, categoria: e.target.value }))}
                            className="rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="">Todas las categorías</option>
                            {CATEGORIAS.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>

                        <input
                            type="date"
                            value={filterForm.fecha_desde}
                            onChange={e => setFilterForm(f => ({ ...f, fecha_desde: e.target.value }))}
                            className="rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />

                        <input
                            type="date"
                            value={filterForm.fecha_hasta}
                            onChange={e => setFilterForm(f => ({ ...f, fecha_hasta: e.target.value }))}
                            className="rounded-xl border border-input bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                                Limpiar
                            </button>
                        )}
                        <button
                            onClick={applyFilters}
                            className="rounded-xl bg-muted px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors"
                        >
                            Aplicar filtros
                        </button>
                    </div>
                </div>

                {/* Tabla de gastos */}
                {gastos.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-card p-12 text-center">
                        <Receipt className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No hay gastos registrados</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Usa el botón "Registrar gasto" para agregar uno</p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border bg-card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="border-b border-border">
                                <tr className="text-left">
                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descripción</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Categoría</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Fecha</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Monto</th>
                                    <th className="px-4 py-3 w-10" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {gastos.map(g => (
                                    <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-foreground">{g.descripcion}</p>
                                            {g.notas && (
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{g.notas}</p>
                                            )}
                                            {g.registrado_por && (
                                                <p className="text-xs text-muted-foreground/60 mt-0.5">Por: {g.registrado_por}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORIA_COLORS[g.categoria] ?? 'bg-muted text-muted-foreground'}`}>
                                                {CATEGORIAS.find(c => c.value === g.categoria)?.label ?? g.categoria}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                            {new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                                            {fmt(g.monto)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleDelete(g.id)}
                                                disabled={deleting === g.id}
                                                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                                                title="Eliminar gasto"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t border-border bg-muted/30">
                                <tr>
                                    <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Total
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-foreground">
                                        {fmt(totalFiltrado)}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
