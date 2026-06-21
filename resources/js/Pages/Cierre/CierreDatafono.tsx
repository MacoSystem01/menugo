import AppShell from '@/Layouts/AppShell';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { CreditCard, ChevronDown, ChevronUp, Printer, Building2 } from 'lucide-react';

interface Transaccion {
    id: number;
    turn_number: number | null;
    customer_name: string;
    payment_method: string;
    amount_paid: number;
    created_at: string;
}

interface GrupoDatafono {
    method: string;
    cantidad: number;
    total: number;
    transacciones: Transaccion[];
}

interface Props {
    agrupados: GrupoDatafono[];
    totalGeneral: number;
    fecha: string;
}

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(n);
}

const METHOD_LABELS: Record<string, string> = {
    tarjeta:       'Tarjeta débito / crédito',
    nequi:         'Nequi',
    daviplata:     'Daviplata',
    pse:           'PSE',
    transferencia: 'Transferencia bancaria',
};

const METHOD_COLORS: Record<string, string> = {
    tarjeta:       'bg-blue-500/15 text-blue-400 border-blue-500/20',
    nequi:         'bg-purple-500/15 text-purple-400 border-purple-500/20',
    daviplata:     'bg-pink-500/15 text-pink-400 border-pink-500/20',
    pse:           'bg-orange-500/15 text-orange-400 border-orange-500/20',
    transferencia: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
};

const METHOD_DOT: Record<string, string> = {
    tarjeta:       'bg-blue-400',
    nequi:         'bg-purple-400',
    daviplata:     'bg-pink-400',
    pse:           'bg-orange-400',
    transferencia: 'bg-cyan-400',
};

export default function CierreDatafono({ agrupados, totalGeneral, fecha }: Props) {
    const [expanded, setExpanded] = useState<string | null>(null);

    function imprimir() {
        window.print();
    }

    return (
        <AppShell title="Cierre de Datáfono" subtitle={`Reporte de ventas electrónicas — ${fecha}`}>
            <Head title="Cierre de Datafono" />

            {/* ── Cabecera de reporte ── */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {agrupados.length} procesador{agrupados.length !== 1 ? 'es' : ''} · {agrupados.reduce((s, g) => s + g.cantidad, 0)} transaccion{agrupados.reduce((s, g) => s + g.cantidad, 0) !== 1 ? 'es' : ''}
                        </p>
                    </div>
                </div>
                <button
                    onClick={imprimir}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/20 hover:text-foreground transition-colors print:hidden"
                >
                    <Printer className="h-4 w-4" />
                    Imprimir reporte
                </button>
            </div>

            {/* ── Resumen KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-2xl border border-border bg-card p-4 lg:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Total ventas electrónicas</span>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="font-display text-3xl font-bold text-accent">{fmt(totalGeneral)}</div>
                    <div className="text-xs text-muted-foreground mt-1">{fecha}</div>
                </div>

                {agrupados.slice(0, 2).map(g => (
                    <div key={g.method} className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${METHOD_DOT[g.method] ?? 'bg-muted-foreground'}`} />
                            <span className="text-xs text-muted-foreground truncate">{METHOD_LABELS[g.method] ?? g.method}</span>
                        </div>
                        <div className="font-display text-xl font-bold">{fmt(g.total)}</div>
                        <div className="text-xs text-muted-foreground mt-1">{g.cantidad} transaccion{g.cantidad !== 1 ? 'es' : ''}</div>
                    </div>
                ))}
            </div>

            {/* ── Sin transacciones ── */}
            {agrupados.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-16 text-center">
                    <CreditCard className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Sin transacciones electrónicas hoy</p>
                    <p className="text-sm text-muted-foreground mt-1">No se registraron pagos por datáfono, Nequi, PSE u otros medios.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {agrupados.map(grupo => {
                        const isOpen = expanded === grupo.method;
                        const colorClass = METHOD_COLORS[grupo.method] ?? 'bg-muted text-muted-foreground border-border';

                        return (
                            <div key={grupo.method} className="rounded-2xl border border-border bg-card overflow-hidden">

                                {/* Cabecera del procesador */}
                                <div className="flex items-center gap-4 px-6 py-5">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <span className="font-display text-base font-bold">
                                                {METHOD_LABELS[grupo.method] ?? grupo.method}
                                            </span>
                                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${colorClass}`}>
                                                {grupo.cantidad} tx
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Procesador: <span className="font-medium capitalize">{grupo.method}</span>
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-display text-2xl font-bold text-accent">{fmt(grupo.total)}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">total del día</div>
                                    </div>
                                </div>

                                {/* Expandir transacciones */}
                                <div className="border-t border-border">
                                    <button
                                        onClick={() => setExpanded(isOpen ? null : grupo.method)}
                                        className="w-full flex items-center justify-between px-6 py-2.5 text-xs text-muted-foreground hover:bg-muted/20 transition-colors"
                                    >
                                        <span>Ver {grupo.cantidad} transaccion{grupo.cantidad !== 1 ? 'es' : ''}</span>
                                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </button>

                                    {isOpen && (
                                        <div className="overflow-x-auto border-t border-border">
                                            <table className="w-full text-sm">
                                                <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
                                                    <tr>
                                                        <th className="text-left px-5 py-3 font-medium">#</th>
                                                        <th className="text-left px-5 py-3 font-medium">Cliente</th>
                                                        <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Fecha/Hora</th>
                                                        <th className="text-right px-5 py-3 font-medium">Valor</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {grupo.transacciones.map(tx => (
                                                        <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                                                            <td className="px-5 py-3">
                                                                <span className="font-bold text-primary">#{tx.turn_number ?? tx.id}</span>
                                                            </td>
                                                            <td className="px-5 py-3 font-medium">{tx.customer_name}</td>
                                                            <td className="px-5 py-3 text-muted-foreground text-xs hidden sm:table-cell whitespace-nowrap">
                                                                {tx.created_at}
                                                            </td>
                                                            <td className="px-5 py-3 text-right">
                                                                <span className="font-display font-bold text-accent">{fmt(tx.amount_paid)}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="border-t-2 border-border bg-muted/20">
                                                    <tr>
                                                        <td colSpan={2} className="px-5 py-3 text-sm font-semibold hidden sm:table-cell">
                                                            Subtotal {METHOD_LABELS[grupo.method] ?? grupo.method}
                                                        </td>
                                                        <td colSpan={2} className="px-5 py-3 text-sm font-semibold sm:hidden">Subtotal</td>
                                                        <td className="px-5 py-3 text-right font-display font-bold text-accent text-base">
                                                            {fmt(grupo.total)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Total general */}
                    <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 px-6 py-5 flex items-center justify-between">
                        <div>
                            <div className="font-display text-base font-bold">Total general datáfono</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                                {agrupados.reduce((s, g) => s + g.cantidad, 0)} transacciones en {agrupados.length} procesador{agrupados.length !== 1 ? 'es' : ''}
                            </div>
                        </div>
                        <div className="font-display text-3xl font-bold text-primary">{fmt(totalGeneral)}</div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
