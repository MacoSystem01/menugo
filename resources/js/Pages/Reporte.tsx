import AppShell from '@/Layouts/AppShell';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Bike, AlertTriangle, BarChart3, FileText, FileSpreadsheet, Download, TrendingDown, Printer } from 'lucide-react';

interface Resumen {
    total_ventas: number;
    total_pedidos: number;
    pedidos_mesa: number;
    pedidos_domicilio: number;
    ticket_promedio: number;
    total_gastos: number;
}

interface TopPlato {
    name: string;
    vendidos: number;
    ingresos: number;
}

interface VentaDia {
    fecha: string;
    total: number;
    pedidos: number;
}

interface Novedad {
    type: string;
    total: number;
}

interface InventarioCritico {
    id: number;
    name: string;
    quantity: number;
    unit: string;
    status: string;
}

interface Props {
    resumen: Resumen;
    top_platos: TopPlato[];
    ventas_por_dia: VentaDia[];
    novedades: Novedad[];
    inventario_critico: InventarioCritico[];
    filters: { desde: string; hasta: string };
}

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

const NOVEDAD_LABEL: Record<string, string> = {
    quemado: 'Quemado', cancelado: 'Cancelado', devuelto: 'Devuelto', dañado: 'Dañado', otro: 'Otro',
};

const INV_STATUS_CLASS: Record<string, string> = {
    bajo:    'bg-yellow-500/15 text-yellow-400',
    agotado: 'bg-red-500/15 text-red-400',
    vencido: 'bg-red-700/15 text-red-500',
};

const REPORTES = [
    { tipo: 'caja',            label: 'Caja',            desc: 'Todos los pagos registrados' },
    { tipo: 'cierre_caja',     label: 'Cierre de Caja',  desc: 'Resumen de efectivo por método' },
    { tipo: 'cierre_datafono', label: 'Cierre Datáfono', desc: 'Transacciones electrónicas' },
    { tipo: 'pedidos',         label: 'Pedidos',         desc: 'Historial completo de pedidos' },
    { tipo: 'cocina',          label: 'Cocina',          desc: 'Listado general de pedidos' },
    { tipo: 'novedades',       label: 'Novedades',       desc: 'Pérdidas y alertas de cocina' },
    { tipo: 'domicilio',       label: 'Domicilio',       desc: 'Domicilios por repartidor' },
    { tipo: 'inventario',      label: 'Inventario',      desc: 'Stock y bodega actual' },
    { tipo: 'gastos',          label: 'Gastos',          desc: 'Gastos y egresos del período' },
] as const;

export default function Reporte({ resumen, top_platos, ventas_por_dia, novedades, inventario_critico, filters }: Props) {
    const [desde, setDesde] = useState(filters.desde);
    const [hasta, setHasta] = useState(filters.hasta);
    const [downloading, setDownloading] = useState<string | null>(null); // "tipo-formato"

    function applyFilters() {
        router.get('/reporte', { desde, hasta }, { preserveState: true });
    }

    async function descargar(tipo: string, formato: string) {
        const key = `${tipo}-${formato}`;
        if (downloading) return;
        setDownloading(key);
        try {
            const params = new URLSearchParams({ tipo, formato, desde, hasta });
            const res = await fetch(`/reporte/exportar?${params}`, {
                credentials: 'include',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
            });
            if (!res.ok) throw new Error('Error al generar el reporte');
            const blob   = await res.blob();
            const ext    = formato === 'xlsx' ? 'xlsx' : 'pdf';
            const suffix = formato === 'pos' ? '_pos' : '';
            const url    = URL.createObjectURL(blob);
            const a      = document.createElement('a');
            a.href       = url;
            a.download   = `${tipo}_${desde}_${hasta}${suffix}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            alert('No se pudo generar el reporte. Intenta de nuevo.');
        } finally {
            setDownloading(null);
        }
    }

    const maxVentas = Math.max(...ventas_por_dia.map(d => d.total), 1);
    const maxVendidos = Math.max(...top_platos.map(p => p.vendidos), 1);

    const kpis = [
        { label: 'Ventas',    value: fmt(resumen.total_ventas),        icon: DollarSign,   color: 'text-primary',    bg: 'bg-primary/10' },
        { label: 'Pedidos',   value: String(resumen.total_pedidos),    icon: ShoppingBag,  color: 'text-blue-400',   bg: 'bg-blue-400/10' },
        { label: 'Mesa',      value: String(resumen.pedidos_mesa),     icon: TrendingUp,   color: 'text-green-400',  bg: 'bg-green-400/10' },
        { label: 'Domicilio', value: String(resumen.pedidos_domicilio),icon: Bike,         color: 'text-purple-400', bg: 'bg-purple-400/10' },
        { label: 'Gastos',    value: fmt(resumen.total_gastos),        icon: TrendingDown, color: 'text-red-400',    bg: 'bg-red-400/10' },
    ];

    return (
        <AppShell title="Reporte" subtitle="Análisis de ventas y operaciones">
            <Head title="Reporte" />

            {/* Filtro de fechas */}
            <div className="flex flex-wrap gap-3 items-end mb-6 p-4 rounded-2xl border border-border bg-card">
                <div>
                    <label className="block text-xs text-muted-foreground mb-1">Desde</label>
                    <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                        className="h-9 rounded-xl border border-input bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                    <label className="block text-xs text-muted-foreground mb-1">Hasta</label>
                    <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                        className="h-9 rounded-xl border border-input bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <button onClick={applyFilters}
                    className="h-9 px-4 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                    Aplicar
                </button>
            </div>

            {/* Exportar reportes */}
            <div className="rounded-2xl border border-border bg-card p-5 mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <Download className="h-4 w-4 text-primary" />
                    <h2 className="font-display text-base font-bold">Exportar reportes</h2>
                    <span className="text-xs text-muted-foreground ml-1">· período seleccionado</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4 ml-6">
                    <span className="inline-flex items-center gap-1"><FileSpreadsheet className="h-3 w-3" /> Excel</span>
                    <span className="mx-2 text-border">·</span>
                    <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" /> PDF carta (A4)</span>
                    <span className="mx-2 text-border">·</span>
                    <span className="inline-flex items-center gap-1"><Printer className="h-3 w-3" /> PDF POS (80 mm)</span>
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {REPORTES.map(({ tipo, label, desc }) => {
                        const loadingXlsx = downloading === `${tipo}-xlsx`;
                        const loadingPdf  = downloading === `${tipo}-pdf`;
                        const loadingPos  = downloading === `${tipo}-pos`;
                        const spin = <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />;
                        return (
                            <div key={tipo} className="rounded-xl border border-border bg-muted/10 p-4">
                                <div className="font-semibold text-sm mb-0.5">{label}</div>
                                <div className="text-xs text-muted-foreground mb-3">{desc}</div>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {/* Excel */}
                                    <button
                                        onClick={() => descargar(tipo, 'xlsx')}
                                        disabled={!!downloading}
                                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-border py-1.5 text-xs font-medium hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-colors disabled:opacity-50 disabled:cursor-wait"
                                        title="Exportar Excel"
                                    >
                                        {loadingXlsx ? <>{spin} ...</> : <><FileSpreadsheet className="h-3.5 w-3.5" /> Excel</>}
                                    </button>
                                    {/* PDF carta */}
                                    <button
                                        onClick={() => descargar(tipo, 'pdf')}
                                        disabled={!!downloading}
                                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-border py-1.5 text-xs font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-50 disabled:cursor-wait"
                                        title="Exportar PDF carta (A4)"
                                    >
                                        {loadingPdf ? <>{spin} ...</> : <><FileText className="h-3.5 w-3.5" /> PDF</>}
                                    </button>
                                    {/* PDF POS */}
                                    <button
                                        onClick={() => descargar(tipo, 'pos')}
                                        disabled={!!downloading}
                                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-border py-1.5 text-xs font-medium hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-400/30 transition-colors disabled:opacity-50 disabled:cursor-wait"
                                        title="Exportar PDF POS (80 mm)"
                                    >
                                        {loadingPos ? <>{spin} ...</> : <><Printer className="h-3.5 w-3.5" /> POS</>}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
                {kpis.map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="rounded-2xl border border-border bg-card p-5">
                        <div className="flex justify-between items-start">
                            <div className="text-xs text-muted-foreground">{label}</div>
                            <div className={`grid h-8 w-8 place-items-center rounded-lg ${bg} ${color}`}>
                                <Icon className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3 font-display text-2xl font-bold">{value}</div>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mb-6">
                {/* Ventas por día */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <h2 className="font-display text-base font-bold">Ventas por día</h2>
                    </div>
                    {ventas_por_dia.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">Sin datos en el rango.</p>
                    ) : (
                        <div className="space-y-2">
                            {ventas_por_dia.map(day => (
                                <div key={day.fecha}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>{new Date(day.fecha + 'T12:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</span>
                                        <span className="font-semibold">{fmt(day.total)} <span className="font-normal text-muted-foreground">({day.pedidos} ped.)</span></span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full bg-gradient-warm" style={{ width: `${(day.total / maxVentas) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top platos */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="font-display text-base font-bold mb-4">Top platos</h2>
                    {top_platos.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">Sin datos en el rango.</p>
                    ) : (
                        <div className="space-y-3">
                            {top_platos.map((p, i) => (
                                <div key={p.name}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">{i + 1}. {p.name}</span>
                                        <span className="text-muted-foreground">{fmt(p.ingresos)}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${(p.vendidos / maxVendidos) * 100}%` }} />
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">{p.vendidos} vendidos</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Novedades de cocina */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        <h2 className="font-display text-base font-bold">Novedades de cocina</h2>
                    </div>
                    {novedades.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Sin novedades en el rango.</p>
                    ) : (
                        <div className="space-y-2">
                            {novedades.map(n => (
                                <div key={n.type} className="flex justify-between items-center text-sm">
                                    <span>{NOVEDAD_LABEL[n.type] ?? n.type}</span>
                                    <span className="font-semibold">{n.total}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Inventario crítico */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="font-display text-base font-bold mb-4">Inventario crítico</h2>
                    {inventario_critico.length === 0 ? (
                        <p className="text-sm text-accent text-center py-4">Todo el inventario está en orden.</p>
                    ) : (
                        <div className="space-y-2">
                            {inventario_critico.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                    <span>{item.name} <span className="text-muted-foreground text-xs">({item.quantity} {item.unit})</span></span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INV_STATUS_CLASS[item.status] ?? 'bg-muted text-muted-foreground'}`}>
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
