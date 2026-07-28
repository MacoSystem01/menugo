import AppShell from '@/Layouts/AppShell';
import { PageProps } from '@/types';
import { tipoDetalle } from '@/utils/order-tipo';
import { Head, router, usePage } from '@inertiajs/react';
import React, { useEffect, useRef, useState } from 'react';

function decodePaginationLabel(label: string): string {
    return label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»').replace(/&amp;/g, '&');
}
import { ShoppingBag, ChevronDown, ChevronUp, Printer, X, Bell, Bike } from 'lucide-react';

interface OrderItem {
    dish: string | null;
    quantity: number;
    unit_price: number;
    notes: string | null;
    is_addition: boolean;
}

interface DeliveryZone {
    label:  string;
    min_km: number;
    max_km: number;
    price:  number;
}

interface OrderRow {
    id: number;
    customer_name: string;
    customer_phone: string;
    tipo: string;
    mesa: number | null;
    turn_number: number | null;
    tracking_token: string | null;
    delivery_address: string | null;
    delivery_phone: string | null;
    status: string;
    total: number;
    delivery_fee: number;
    amount_paid: number;
    payment_method: string | null;
    notas: string | null;
    items: OrderItem[];
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Filters {
    status?: string;
    tipo?: string;
    fecha?: string;
    mesa_id?: string;
}

interface TableRow {
    id: number;
    number: number;
}

interface Props {
    orders:         Paginated<OrderRow>;
    tables:         TableRow[];
    filters:        Filters;
    delivery_zones: DeliveryZone[];
    flash?: { success?: string; error?: string };
}

function fmt(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

const STATUS_LABEL: Record<string, string> = {
    pending:    'Pendiente',
    at_cash:    'En caja',
    in_kitchen: 'En cocina',
    cooking:    'Cocinando',
    ready:      'Listo',
    delivered:  'Entregado',
    cancelled:  'Cancelado',
};

const STATUS_STYLE: Record<string, { cls: string; dot: string; pulse: boolean }> = {
    pending:    { cls: 'bg-slate-500/20   text-slate-300   border border-slate-500/40',   dot: 'bg-slate-400',   pulse: false },
    at_cash:    { cls: 'bg-amber-400/20   text-amber-300   border border-amber-400/40',   dot: 'bg-amber-400',   pulse: true  },
    in_kitchen: { cls: 'bg-blue-500/20    text-blue-300    border border-blue-500/40',    dot: 'bg-blue-400',    pulse: true  },
    cooking:    { cls: 'bg-orange-500/20  text-orange-300  border border-orange-500/40',  dot: 'bg-orange-400',  pulse: true  },
    ready:      { cls: 'bg-yellow-400/25  text-yellow-300  border border-yellow-400/60',  dot: 'bg-yellow-400',  pulse: true  },
    delivered:  { cls: 'bg-violet-500/25  text-violet-300  border border-violet-500/60',  dot: 'bg-violet-400',  pulse: false },
    cancelled:  { cls: 'bg-red-500/20     text-red-300     border border-red-500/40',     dot: 'bg-red-400',     pulse: false },
};

const PAYMENT_LABELS: Record<string, string> = {
    efectivo:      'Efectivo',
    tarjeta:       'Tarjeta',
    nequi:         'Nequi',
    daviplata:     'Daviplata',
    pse:           'PSE',
    transferencia: 'Transferencia',
};

// ── Ticket de impresión ────────────────────────────────────────────────────────
function PrintTicket({ order }: { order: OrderRow }) {
    const { props }       = usePage<PageProps>();
    const subtotalesItems = order.items.filter(i => !i.is_addition);
    const adiciones       = order.items.filter(i => i.is_addition);
    const parts           = order.created_at.split(' ');
    const fecha           = parts[0] ?? '';
    const hora            = parts[1] ?? '';
    const tenantAddress   = (props.tenant_address   as string | undefined) || '';
    const tenantPhone     = (props.tenant_phone     as string | undefined) || '';
    const logoSrc         = (props.tenant_logo_url  as string | undefined) || '/logo.png';

    return (
        <div id="menugo-print-area" style={{
            fontFamily: "'Segoe UI', Arial, sans-serif",
            color: '#1a1a1a',
            background: '#ffffff',
            width: '100%',
            maxWidth: '340px',
            margin: '0 auto',
            padding: '0',
        }}>

            {/* ══ ENCABEZADO: Lugar · Fecha · Hora · N° Orden ══════════════════ */}
            <div style={{ textAlign: 'center', paddingBottom: '14px', borderBottom: '2px solid #1a1a1a' }}>
                <img
                    src={logoSrc}
                    alt="Logo"
                    style={{ height: '52px', width: 'auto', objectFit: 'contain', marginBottom: '5px' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                {props.tenant_name && (
                    <div style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        {props.tenant_name}
                    </div>
                )}
                <div style={{ fontSize: '10px', letterSpacing: '3px', color: '#666', textTransform: 'uppercase', marginTop: '2px' }}>
                    Sistema de Pedidos
                </div>
                {tenantAddress && (
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>{tenantAddress}</div>
                )}
                {tenantPhone && (
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '1px' }}>Tel. {tenantPhone}</div>
                )}

                {/* Fecha · Hora · Orden en una sola fila */}
                <div style={{
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px dashed #bbb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                }}>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Fecha</div>
                        <div style={{ fontSize: '12px', fontWeight: '600' }}>{fecha}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Hora</div>
                        <div style={{ fontSize: '12px', fontWeight: '600' }}>{hora}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Orden</div>
                        <div style={{ fontSize: '22px', fontWeight: '800', lineHeight: 1.1, color: '#1a1a1a' }}>
                            #{String(order.turn_number ?? order.id).padStart(4, '0')}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ CLIENTE ══════════════════════════════════════════════════════ */}
            <div style={{ padding: '10px 0', borderBottom: '1px dashed #bbb' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '5px', fontWeight: '700' }}>
                    Cliente
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>{order.customer_name}</div>
                {order.customer_phone && (
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '1px' }}>Tel. {order.customer_phone}</div>
                )}
            </div>

            {/* ══ TIPO DE PEDIDO ════════════════════════════════════════════════ */}
            <div style={{ padding: '8px 0', borderBottom: '1px dashed #bbb' }}>
                <div style={{
                    display: 'inline-block',
                    background: '#1a1a1a', color: '#fff',
                    padding: '4px 14px', borderRadius: '20px',
                    fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px',
                    marginBottom: order.tipo === 'domicilio' ? '5px' : undefined,
                }}>
                    {tipoDetalle(order.tipo, order.mesa, order.turn_number)}
                </div>
                {order.tipo === 'domicilio' && (
                    <>
                        {order.delivery_address && (
                            <div style={{ fontSize: '12px', color: '#444', lineHeight: '1.4' }}>
                                {order.delivery_address}
                            </div>
                        )}
                        {order.delivery_phone && (
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                Tel. contacto: {order.delivery_phone}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ══ PEDIDO ════════════════════════════════════════════════════════ */}
            <div style={{ padding: '10px 0' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700', marginBottom: '8px' }}>
                    Pedido
                </div>

                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto',
                    gap: '0 8px', fontSize: '10px', color: '#888',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    paddingBottom: '5px', borderBottom: '1px solid #ddd',
                    marginBottom: '6px',
                }}>
                    <span>Producto</span>
                    <span style={{ textAlign: 'center' }}>Cant</span>
                    <span style={{ textAlign: 'right' }}>Subtotal</span>
                </div>

                {subtotalesItems.map((item, i) => (
                    <div key={i} style={{ marginBottom: '7px' }}>
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr auto auto',
                            gap: '0 8px', alignItems: 'baseline',
                        }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', lineHeight: '1.3' }}>
                                {item.dish ?? '—'}
                            </span>
                            <span style={{ fontSize: '13px', textAlign: 'center', color: '#444', minWidth: '24px' }}>
                                {item.quantity}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: '600', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                {fmt(item.unit_price * item.quantity)}
                            </span>
                        </div>
                        {item.notes && (
                            <div style={{ fontSize: '11px', color: '#888', paddingLeft: '2px', marginTop: '1px', fontStyle: 'italic' }}>
                                ↳ {item.notes}
                            </div>
                        )}
                    </div>
                ))}

                {adiciones.length > 0 && (
                    <>
                        <div style={{
                            fontSize: '10px', color: '#888', textTransform: 'uppercase',
                            letterSpacing: '1px', fontWeight: '700',
                            margin: '8px 0 5px', paddingTop: '7px', borderTop: '1px dashed #ddd',
                        }}>
                            Adiciones
                        </div>
                        {adiciones.map((item, i) => (
                            <div key={i} style={{ marginBottom: '5px' }}>
                                <div style={{
                                    display: 'grid', gridTemplateColumns: '1fr auto auto',
                                    gap: '0 8px', alignItems: 'baseline',
                                }}>
                                    <span style={{ fontSize: '12px', color: '#555' }}>{item.dish ?? '—'}</span>
                                    <span style={{ fontSize: '12px', textAlign: 'center', color: '#555', minWidth: '24px' }}>{item.quantity}</span>
                                    <span style={{ fontSize: '12px', textAlign: 'right', color: '#555', whiteSpace: 'nowrap' }}>
                                        {fmt(item.unit_price * item.quantity)}
                                    </span>
                                </div>
                                {item.notes && (
                                    <div style={{ fontSize: '11px', color: '#999', paddingLeft: '2px', fontStyle: 'italic' }}>
                                        ↳ {item.notes}
                                    </div>
                                )}
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* ══ CUENTA: Total · Estado · Pago ═════════════════════════════════ */}
            <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: '10px' }}>

                {/* Domicilio (si aplica) */}
                {order.tipo === 'domicilio' && order.delivery_fee > 0 && (
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        paddingBottom: '6px', marginBottom: '6px',
                        borderBottom: '1px dashed #bbb',
                    }}>
                        <span style={{ fontSize: '12px', color: '#555' }}>Subtotal productos</span>
                        <span style={{ fontSize: '12px' }}>{fmt(order.total - order.delivery_fee)}</span>
                    </div>
                )}
                {order.tipo === 'domicilio' && order.delivery_fee > 0 && (
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        paddingBottom: '8px', marginBottom: '8px',
                        borderBottom: '1px dashed #bbb',
                    }}>
                        <span style={{ fontSize: '12px', color: '#555' }}>Domicilio</span>
                        <span style={{ fontSize: '12px', fontWeight: '600' }}>{fmt(order.delivery_fee)}</span>
                    </div>
                )}

                {/* Total */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingBottom: '10px', borderBottom: '2px solid #1a1a1a', marginBottom: '10px',
                }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</span>
                    <span style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>{fmt(order.total)}</span>
                </div>

                {/* Estado · Pago · Abonado */}
                <div style={{ paddingBottom: '10px', borderBottom: '1px dashed #bbb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</span>
                        <span style={{
                            fontSize: '12px', fontWeight: '700',
                            padding: '2px 10px', borderRadius: '20px',
                            border: '1.5px solid #1a1a1a',
                        }}>
                            {STATUS_LABEL[order.status] ?? order.status}
                        </span>
                    </div>
                    {order.payment_method && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pago</span>
                            <span style={{ fontSize: '12px', fontWeight: '600' }}>
                                {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
                            </span>
                        </div>
                    )}
                    {order.amount_paid > 0 && order.amount_paid < order.total && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Abonado</span>
                            <span style={{ fontSize: '12px', fontWeight: '600' }}>{fmt(order.amount_paid)}</span>
                        </div>
                    )}
                </div>

                {/* Observaciones */}
                {order.notas && (
                    <div style={{ padding: '8px 0', borderBottom: '1px dashed #bbb' }}>
                        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700', marginBottom: '3px' }}>
                            Observaciones
                        </div>
                        <div style={{ fontSize: '12px', color: '#444', fontStyle: 'italic', lineHeight: '1.5' }}>{order.notas}</div>
                    </div>
                )}
            </div>

            {/* ══ PIE DE PÁGINA ════════════════════════════════════════════════ */}
            <div style={{ textAlign: 'center', padding: '14px 0 4px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '2px' }}>¡Gracias por su preferencia!</div>
                <div style={{ fontSize: '11px', color: '#888' }}>Menugo.app · Powered by Menugo</div>
            </div>

        </div>
    );
}

// ── Modal de impresión ─────────────────────────────────────────────────────────
function PrintModal({ order, onClose }: { order: OrderRow; onClose: () => void }) {
    const ticketRef = useRef<HTMLDivElement>(null);

    // Inyectar CSS de impresión al montar
    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'menugo-print-css';
        style.textContent = `
            @media print {
                body > * { visibility: hidden !important; }
                #menugo-print-portal { visibility: visible !important; position: fixed !important; inset: 0 !important; z-index: 9999 !important; display: flex !important; background: white !important; align-items: flex-start !important; justify-content: center !important; padding-top: 24px !important; }
                #menugo-print-portal * { visibility: visible !important; }
                @page { margin: 8mm; size: A4 portrait; }
            }
        `;
        document.head.appendChild(style);
        return () => document.getElementById('menugo-print-css')?.remove();
    }, []);

    // Cerrar con Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <>
            {/* Portal de impresión — invisible en pantalla, visible al imprimir */}
            <div id="menugo-print-portal" style={{ display: 'none' }}>
                <PrintTicket order={order} />
            </div>

            {/* Modal de previsualización */}
            <div
                className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
                onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            >
                <div className="w-full max-w-lg my-4">

                    {/* Barra de acciones */}
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div>
                            <h2 className="font-display text-lg font-bold text-white">
                                Vista previa — Orden #{String(order.id).padStart(4, '0')}
                            </h2>
                            <p className="text-xs text-white/50 mt-0.5">Revisa el ticket antes de imprimir</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-2 rounded-xl bg-white text-gray-900 px-5 py-2.5 text-sm font-bold hover:bg-gray-100 transition-colors shadow-lg"
                            >
                                <Printer className="h-4 w-4" />
                                Imprimir
                            </button>
                            <button
                                onClick={onClose}
                                className="h-10 w-10 grid place-items-center rounded-xl border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Papel del ticket */}
                    <div
                        ref={ticketRef}
                        className="rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
                        style={{
                            background: 'white',
                            padding: '28px 24px',
                        }}
                    >
                        <PrintTicket order={order} />
                    </div>

                    {/* Nota de impresión */}
                    <p className="text-center text-xs text-white/30 mt-4">
                        Ctrl + P para imprimir · Esc para cerrar
                    </p>
                </div>
            </div>
        </>
    );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function Orders({ orders, tables, filters, delivery_zones, flash }: Props) {
    const { props }   = usePage<PageProps>();
    const userRole    = (props as any).auth?.user?.role ?? '';
    const canSeeAddr  = ['gerente', 'administrador'].includes(userRole);

    const [expanded,   setExpanded]   = useState<number | null>(null);
    const [printing,   setPrinting]   = useState<OrderRow | null>(null);
    const [localFilters, setLocal]    = useState<Filters>(filters);

    // ── Alerta de domicilios listos sin repartidor ─────────────────────────────
    type AlertOrder = { id: number; customer_name: string; delivery_address: string | null; ready_at: string | null };
    const [deliveryAlert, setDeliveryAlert] = useState<{ count: number; orders: AlertOrder[] }>({ count: 0, orders: [] });
    const prevAlertCount = useRef<number | null>(null);
    const [alertFlash,   setAlertFlash]   = useState(false);

    useEffect(() => {
        async function fetchAlerts() {
            try {
                const res  = await fetch('/api/delivery-alerts', { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                if (!res.ok) return;
                const data = await res.json() as { count: number; orders: AlertOrder[] };
                if (prevAlertCount.current !== null && data.count > prevAlertCount.current) {
                    setAlertFlash(true);
                    setTimeout(() => setAlertFlash(false), 4000);
                }
                prevAlertCount.current = data.count;
                setDeliveryAlert(data);
            } catch { /* red silenciosa */ }
        }
        fetchAlerts();
        const id = setInterval(fetchAlerts, 20_000);
        return () => clearInterval(id);
    }, []);

    function applyFilters(newFilters: Filters) {
        setLocal(newFilters);
        router.get('/pedidos', newFilters as Record<string, string>, { preserveState: true });
    }

    function cancelar(id: number) {
        if (!confirm('¿Cancelar este pedido?')) return;
        router.post(`/pedidos/${id}/cancelar`);
    }

    return (
        <AppShell title="Pedidos" subtitle="Historial de todos los pedidos">
            <Head title="Pedidos" />

            {printing && <PrintModal order={printing} onClose={() => setPrinting(null)} />}

            {flash?.success && (
                <div className="mb-4 rounded-xl bg-accent/15 border border-accent/30 text-accent px-4 py-3 text-sm">{flash.success}</div>
            )}

            {/* ── Alerta: domicilios listos sin repartidor ── */}
            {deliveryAlert.count > 0 && (
                <div className={`mb-5 rounded-xl border px-4 py-3 flex items-center justify-between gap-3 transition-colors duration-700 ${
                    alertFlash
                        ? 'bg-red-500/20 border-red-500/50'
                        : 'bg-amber-500/15 border-amber-500/30'
                }`}>
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="relative flex h-3 w-3 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
                        </span>
                        <Bell className={`h-4 w-4 shrink-0 ${alertFlash ? 'text-red-400' : 'text-amber-400'}`} />
                        <div className="min-w-0">
                            <p className={`text-sm font-semibold ${alertFlash ? 'text-red-300' : 'text-amber-300'}`}>
                                {deliveryAlert.count === 1
                                    ? '1 pedido de domicilio listo — esperando repartidor'
                                    : `${deliveryAlert.count} pedidos de domicilio listos — esperando repartidor`}
                            </p>
                            {deliveryAlert.orders.length > 0 && (
                                <p className="text-xs text-amber-300/65 mt-0.5 truncate">
                                    {deliveryAlert.orders.map(o => `#${o.id} ${o.customer_name}${o.ready_at ? ` (${o.ready_at})` : ''}`).join(' · ')}
                                </p>
                            )}
                        </div>
                    </div>
                    <a
                        href="/domicilio"
                        className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 border transition-colors ${
                            alertFlash
                                ? 'text-red-300 border-red-500/40 hover:bg-red-500/20'
                                : 'text-amber-300 border-amber-500/40 hover:bg-amber-500/20'
                        }`}
                    >
                        <Bike className="h-3.5 w-3.5" />
                        Ir a Domicilio
                    </a>
                </div>
            )}

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-6">
                <select
                    value={localFilters.status ?? ''}
                    onChange={e => applyFilters({ ...localFilters, status: e.target.value || undefined })}
                    className="h-9 rounded-xl border border-input bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">Todos los estados</option>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select
                    value={localFilters.tipo ?? ''}
                    onChange={e => {
                        const newTipo = e.target.value || undefined;
                        applyFilters({ ...localFilters, tipo: newTipo, mesa_id: newTipo !== 'mesa' ? undefined : localFilters.mesa_id });
                    }}
                    className="h-9 rounded-xl border border-input bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">Todos los tipos</option>
                    <option value="mesa">Mesa</option>
                    <option value="domicilio">Domicilio</option>
                </select>

                {localFilters.tipo === 'mesa' && (
                    <select
                        value={localFilters.mesa_id ?? ''}
                        onChange={e => applyFilters({ ...localFilters, mesa_id: e.target.value || undefined })}
                        className="h-9 rounded-xl border border-input bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="">Todas las mesas</option>
                        {tables.map(t => (
                            <option key={t.id} value={t.id}>Mesa {t.number}</option>
                        ))}
                    </select>
                )}

                <input
                    type="date"
                    value={localFilters.fecha ?? ''}
                    onChange={e => applyFilters({ ...localFilters, fecha: e.target.value || undefined })}
                    className="h-9 rounded-xl border border-input bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {(localFilters.status || localFilters.tipo || localFilters.fecha || localFilters.mesa_id) && (
                    <button onClick={() => applyFilters({})} className="h-9 rounded-xl border border-border px-3 text-xs text-muted-foreground hover:bg-muted transition-colors">
                        Limpiar filtros
                    </button>
                )}
                <span className="ml-auto text-sm text-muted-foreground self-center">{orders.total} pedidos</span>
            </div>

            {orders.data.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center">
                    <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Sin pedidos</p>
                    <p className="text-sm text-muted-foreground mt-1">No hay pedidos que coincidan con los filtros.</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs uppercase text-muted-foreground bg-muted/30 border-b border-border">
                            <tr>
                                <th className="text-left px-6 py-3 font-medium">#</th>
                                <th className="text-left px-6 py-3 font-medium">Cliente</th>
                                <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Tipo</th>
                                <th className="text-left px-6 py-3 font-medium">Estado</th>
                                <th className="text-right px-6 py-3 font-medium">Total</th>
                                <th className="text-right px-6 py-3 font-medium hidden md:table-cell">Fecha</th>
                                <th className="text-center px-4 py-3 font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {orders.data.map(o => (
                                <React.Fragment key={o.id}>
                                    <tr className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-primary">#{o.turn_number ?? o.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{o.customer_name}</div>
                                            <div className="text-xs text-muted-foreground">{o.customer_phone}</div>
                                            {canSeeAddr && o.tipo === 'domicilio' && o.delivery_address && (
                                                <div className="text-xs text-yellow-400 mt-0.5 flex items-center gap-1">
                                                    <span>📍</span>
                                                    <span className="truncate max-w-50">{o.delivery_address}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                                            {tipoDetalle(o.tipo, o.mesa, o.turn_number)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const s = STATUS_STYLE[o.status] ?? STATUS_STYLE['pending'];
                                                return (
                                                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${s.cls}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot} ${s.pulse ? 'animate-pulse' : ''}`} />
                                                        {STATUS_LABEL[o.status] ?? o.status}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold">{fmt(o.total)}</td>
                                        <td className="px-6 py-4 text-right text-muted-foreground hidden md:table-cell">{o.created_at}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-center gap-1">
                                                {/* Imprimir orden */}
                                                <button
                                                    onClick={() => setPrinting(o)}
                                                    title="Imprimir orden"
                                                    className="p-1.5 rounded-lg hover:bg-primary/15 hover:text-primary text-muted-foreground transition-colors"
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </button>
                                                {/* Ver detalle */}
                                                <button
                                                    onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                                                    title="Ver detalle"
                                                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                                                >
                                                    {expanded === o.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expanded === o.id && (
                                        <tr key={`${o.id}-detail`} className="bg-muted/10">
                                            <td colSpan={7} className="px-8 py-4">
                                                <div className="space-y-1 mb-3">
                                                    {o.items.map((item, i) => (
                                                        <div key={i} className="flex justify-between text-sm">
                                                            <span className="flex items-center gap-1.5">
                                                                {item.quantity}× {item.dish ?? '—'}
                                                                {item.is_addition && (
                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-semibold">
                                                                        Adición
                                                                    </span>
                                                                )}
                                                                {item.notes ? ` (${item.notes})` : ''}
                                                            </span>
                                                            <span className="text-muted-foreground">{fmt(item.unit_price * item.quantity)}</span>
                                                        </div>
                                                    ))}
                                                    {o.delivery_fee > 0 && (
                                                        <div className="flex justify-between text-sm text-yellow-400 font-medium pt-1 border-t border-border/50">
                                                            <span>Domicilio</span>
                                                            <span>{fmt(o.delivery_fee)}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Selector de tarifa de domicilio */}
                                                {o.tipo === 'domicilio' && delivery_zones.length > 0 && (
                                                    <div className="mb-3 space-y-1.5">
                                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                            Tarifa de domicilio
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {delivery_zones.map((zone, zi) => {
                                                                const isActive = o.delivery_fee === zone.price;
                                                                return (
                                                                    <button
                                                                        key={zi}
                                                                        type="button"
                                                                        onClick={() => router.post(`/caja/${o.id}/tarifa-domicilio`, { delivery_fee: zone.price })}
                                                                        className={`flex flex-col items-start px-3 py-1.5 rounded-xl border text-xs transition-colors ${
                                                                            isActive
                                                                                ? 'border-primary bg-primary/10 text-primary'
                                                                                : 'border-border hover:border-primary/50 hover:bg-muted text-muted-foreground'
                                                                        }`}
                                                                    >
                                                                        <span className="font-semibold">{zone.min_km}–{zone.max_km} km</span>
                                                                        <span className={isActive ? 'text-primary font-bold' : 'text-foreground font-bold'}>
                                                                            {zone.price === 0 ? 'Gratis' : fmt(zone.price)}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {o.notas && <p className="text-xs text-muted-foreground mb-2">Nota: {o.notas}</p>}
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => setPrinting(o)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                                                    >
                                                        <Printer className="h-3 w-3" /> Imprimir orden
                                                    </button>
                                                    {!['delivered', 'cancelled'].includes(o.status) && (
                                                        <>
                                                            <a
                                                                href={`/carta?add_to=${o.tracking_token}&waiter=true`}
                                                                className="text-xs text-amber-500 hover:underline"
                                                            >
                                                                Adición
                                                            </a>
                                                            <button
                                                                onClick={() => cancelar(o.id)}
                                                                className="text-xs text-red-400 hover:underline"
                                                            >
                                                                Cancelar pedido
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    </div>

                    {/* Paginación */}
                    {orders.last_page > 1 && (
                        <div className="flex justify-center gap-1 p-4 border-t border-border">
                            {orders.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    className={`min-w-8 h-8 px-2 rounded-lg text-xs font-medium transition-colors
                                        ${link.active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground disabled:opacity-40'}`}
                                >{decodePaginationLabel(link.label)}</button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </AppShell>
    );
}
