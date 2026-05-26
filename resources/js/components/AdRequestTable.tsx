/**
 * AdRequestTable — tabla paginada de solicitudes publicitarias.
 * Compartida entre /admin/publicidad (context='banner')
 * y /admin/publicidad-slider (context='slider').
 *
 * Reglas de visibilidad:
 *   banner → solo type='banner' + type='combo'
 *   slider → solo type='slider' + type='combo'
 * El combo aparece en ambas vistas con badge especial.
 */

import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    Megaphone, ChevronLeft, ChevronRight,
    CheckCircle2, Clock, XCircle, Sparkles, FileCheck, Layers,
    CheckCheck, Ban, AlertTriangle, X,
} from 'lucide-react';

export interface AdRequest {
    id:               number;
    type:             'banner' | 'slider' | 'combo';
    business_name:    string;
    contact_name:     string;
    contact_email:    string;
    contact_phone:    string | null;
    image_url:        string | null;
    proof_url:        string | null;
    ai_enhanced:      boolean;
    status:           'pending_payment' | 'pending_review' | 'active' | 'rejected';
    admin_notes:      string | null;
    created_at:       string;
    payment_proof_at: string | null;
}

interface Props {
    requests: AdRequest[];
    /** Contexto de la vista actual: filtra y rotula correctamente */
    context: 'banner' | 'slider';
    /**
     * Oculta el encabezado interno ("Reporte Publicitario") y elimina el
     * margen superior del wrapper. Usar cuando el componente se embebe dentro
     * de una sección que ya tiene su propio título (p.ej. /admin/billing).
     */
    hideHeader?: boolean;
}

/* ── constantes ─────────────────────────────────────────────────────────── */

const STATUS_CFG: Record<AdRequest['status'], { label: string; cls: string; Icon: React.ElementType }> = {
    pending_payment: { label: 'Sin comprobante', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30', Icon: Clock },
    pending_review:  { label: 'En revisión',     cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30',      Icon: FileCheck },
    active:          { label: 'Activo',           cls: 'bg-green-500/15 text-green-400 border-green-500/30',   Icon: CheckCircle2 },
    rejected:        { label: 'Rechazado',        cls: 'bg-red-500/15 text-red-400 border-red-500/30',         Icon: XCircle },
};

const CONTEXT_LABEL = { banner: 'Banner Principal', slider: 'Slider Negocios' } as const;

const PER_PAGE = 5;

/* ── helpers ─────────────────────────────────────────────────────────────── */

function parsePhones(raw: string | null): string {
    if (!raw) return '—';
    try {
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr.join(' · ') : raw;
    } catch { return raw; }
}

/** Badge del tipo de solicitud, considerando combo */
function TypeBadge({ req, context }: { req: AdRequest; context: 'banner' | 'slider' }) {
    if (req.type === 'combo') {
        return (
            <div className="flex flex-col gap-1">
                {/* Badge principal COMBO */}
                <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400">
                    <Layers className="h-3 w-3" />
                    Combo
                </span>
                {/* Indicador de qué incluye */}
                <span className="text-[10px] text-muted-foreground leading-tight">
                    Banner Principal<br />+ Slider Negocios
                </span>
                {/* Contexto actual */}
                <span className="inline-flex items-center rounded-md border border-muted/50 bg-muted/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Vista: {CONTEXT_LABEL[context]}
                </span>
            </div>
        );
    }

    const colors = req.type === 'banner'
        ? 'border-violet-500/30 bg-violet-500/15 text-violet-400'
        : 'border-blue-500/30 bg-blue-500/15 text-blue-400';

    return (
        <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colors}`}>
            {CONTEXT_LABEL[req.type as 'banner' | 'slider']}
        </span>
    );
}

/* ── Términos y condiciones — texto del aviso ──────────────────────────────── */
const TC_NOTICE =
    'Al cancelar esta solicitud, el motivo ingresado quedará registrado en el sistema ' +
    'y podrá ser consultado por el solicitante conforme a los Términos y Condiciones ' +
    'vigentes de la plataforma Menugo. Esta acción es irreversible.';

/* ── componente principal ─────────────────────────────────────────────────── */

export default function AdRequestTable({ requests, context, hideHeader = false }: Props) {
    const [page, setPage] = useState(1);

    // Calcular totalPages aquí para usarlo tanto en el efecto como en el render
    const totalPages = Math.max(1, Math.ceil(requests.length / PER_PAGE));

    // Resetear página si la lista encoge y la página actual queda fuera de rango.
    // Se hace en useEffect para no llamar a setPage durante el ciclo de render (anti-patrón React).
    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    // Estado del modal de cancelación
    const [rejectModal, setRejectModal] = useState<{
        open:       boolean;
        id:         number | null;
        business:   string;
        reason:     string;
        submitting: boolean;
        error:      string;
    }>({ open: false, id: null, business: '', reason: '', submitting: false, error: '' });

    // Estado de publicación en progreso
    const [approvingId, setApprovingId] = useState<number | null>(null);

    function openRejectModal(req: AdRequest) {
        setRejectModal({ open: true, id: req.id, business: req.business_name, reason: '', submitting: false, error: '' });
    }

    function closeRejectModal() {
        if (rejectModal.submitting) return;
        setRejectModal(m => ({ ...m, open: false }));
    }

    function handleApprove(id: number) {
        if (!confirm('¿Confirmas publicar esta solicitud publicitaria?')) return;
        setApprovingId(id);
        router.patch(`/admin/ad-requests/${id}/approve`, {}, {
            preserveScroll: true,
            onFinish: () => setApprovingId(null),
        });
    }

    function handleRejectSubmit() {
        if (!rejectModal.id) return;                  // guard: no debería ocurrir, pero protege la URL
        if (!rejectModal.reason.trim()) {
            setRejectModal(m => ({ ...m, error: 'El motivo de cancelación es obligatorio.' }));
            return;
        }
        setRejectModal(m => ({ ...m, submitting: true, error: '' }));
        router.patch(`/admin/ad-requests/${rejectModal.id}/reject`,
            { reason: rejectModal.reason.trim() },
            {
                preserveScroll: true,
                onSuccess: () => setRejectModal({ open: false, id: null, business: '', reason: '', submitting: false, error: '' }),
                onError:   () => setRejectModal(m => ({ ...m, submitting: false, error: 'No se pudo registrar la cancelación. Intenta de nuevo.' })),
            }
        );
    }

    const pagedRequests = requests.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div className={hideHeader ? '' : 'mt-10'}>
            {!hideHeader && (
                <h2 className="font-display text-base font-bold mb-4 flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                    Reporte Publicitario
                    <span className="text-sm font-normal text-muted-foreground">({requests.length})</span>
                </h2>
            )}

            {requests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-12 text-center">
                    <Megaphone className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-semibold">Sin solicitudes publicitarias</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Aparecerán aquí cuando alguien envíe una solicitud desde la página de inicio.
                    </p>
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Tipo</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Negocio</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Contacto</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Teléfono</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Estado</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Material</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Solicitado</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {pagedRequests.map(req => {
                                    const st = STATUS_CFG[req.status];
                                    return (
                                        <tr
                                            key={req.id}
                                            className={`hover:bg-muted/20 transition-colors ${req.type === 'combo' ? 'bg-amber-500/5' : ''}`}
                                        >
                                            {/* Tipo */}
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex flex-col gap-1.5">
                                                    <TypeBadge req={req} context={context} />
                                                    {req.ai_enhanced && (
                                                        <span className="inline-flex items-center gap-0.5 rounded-lg border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary w-fit">
                                                            <Sparkles className="h-2.5 w-2.5" /> IA
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Negocio */}
                                            <td className="px-4 py-3 align-top max-w-40">
                                                <p className="font-semibold truncate">{req.business_name}</p>
                                            </td>

                                            {/* Contacto */}
                                            <td className="px-4 py-3 align-top max-w-48">
                                                <p className="font-medium truncate">{req.contact_name}</p>
                                                <p className="text-[11px] text-muted-foreground truncate">{req.contact_email}</p>
                                            </td>

                                            {/* Teléfono */}
                                            <td className="px-4 py-3 align-top whitespace-nowrap">
                                                <span className="text-xs text-muted-foreground">
                                                    {parsePhones(req.contact_phone)}
                                                </span>
                                            </td>

                                            {/* Estado */}
                                            <td className="px-4 py-3 align-top whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${st.cls}`}>
                                                    <st.Icon className="h-3 w-3" />
                                                    {st.label}
                                                </span>
                                                {req.payment_proof_at && (
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                        Comprobante: {req.payment_proof_at}
                                                    </p>
                                                )}
                                                {req.admin_notes && (
                                                    <p className="text-[10px] text-muted-foreground/70 mt-0.5 max-w-40 truncate" title={req.admin_notes}>
                                                        Nota: {req.admin_notes}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Material */}
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex flex-col gap-1.5">
                                                    {req.image_url ? (
                                                        <a href={req.image_url} target="_blank" rel="noopener noreferrer">
                                                            <img
                                                                src={req.image_url}
                                                                alt="Material"
                                                                className="h-10 w-16 rounded-lg object-cover border border-border hover:opacity-80 transition-opacity"
                                                            />
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                    {req.proof_url && (
                                                        <a
                                                            href={req.proof_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-[10px] text-green-400 hover:underline"
                                                        >
                                                            <FileCheck className="h-3.5 w-3.5" />
                                                            Comprobante
                                                        </a>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Fecha */}
                                            <td className="px-4 py-3 align-top whitespace-nowrap">
                                                <span className="text-xs text-muted-foreground">{req.created_at}</span>
                                            </td>

                                            {/* Acción — solo filas pendientes llegan aquí */}
                                            <td className="px-4 py-3 align-top whitespace-nowrap">
                                                <div className="flex flex-col gap-1.5">
                                                    <button
                                                        onClick={() => handleApprove(req.id)}
                                                        disabled={approvingId === req.id}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-green-500/40 bg-green-500/10 px-2.5 py-1 text-[11px] font-bold text-green-400 hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {approvingId === req.id
                                                            ? <div className="h-3 w-3 rounded-full border-2 border-green-400/40 border-t-green-400 animate-spin" />
                                                            : <CheckCheck className="h-3.5 w-3.5" />
                                                        }
                                                        Publicar
                                                    </button>
                                                    <button
                                                        onClick={() => openRejectModal(req)}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-400 hover:bg-red-500/20 transition-colors"
                                                    >
                                                        <Ban className="h-3.5 w-3.5" />
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                            <span className="text-xs text-muted-foreground">
                                Página {page} de {totalPages} · {requests.length} solicitudes
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-7 w-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`h-7 min-w-7 px-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                            p === page
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'border-border text-muted-foreground hover:bg-muted/50'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="h-7 w-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ══ Modal de cancelación ══════════════════════════════════════════════ */}
            {rejectModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={closeRejectModal}
                    />

                    {/* Panel */}
                    <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border px-5 py-4">
                            <div className="flex items-center gap-2">
                                <Ban className="h-4 w-4 text-red-400" />
                                <h3 className="font-display text-sm font-bold">Cancelar solicitud publicitaria</h3>
                            </div>
                            <button
                                onClick={closeRejectModal}
                                disabled={rejectModal.submitting}
                                className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4">
                            {/* Negocio afectado */}
                            <p className="text-sm text-muted-foreground">
                                Estás cancelando la solicitud de{' '}
                                <span className="font-semibold text-foreground">{rejectModal.business}</span>.
                                Este estado no podrá revertirse sin crear una nueva solicitud.
                            </p>

                            {/* Campo de motivo */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                                    Motivo de cancelación <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    rows={4}
                                    value={rejectModal.reason}
                                    onChange={e => setRejectModal(m => ({ ...m, reason: e.target.value, error: '' }))}
                                    placeholder="Describe el motivo por el que se cancela esta solicitud publicitaria…"
                                    maxLength={600}
                                    disabled={rejectModal.submitting}
                                    className="w-full rounded-xl border border-input bg-input px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400/40 disabled:opacity-50 placeholder:text-muted-foreground/50"
                                />
                                <div className="flex justify-between mt-1">
                                    {rejectModal.error
                                        ? <p className="text-[11px] text-red-400">{rejectModal.error}</p>
                                        : <span />
                                    }
                                    <span className="text-[10px] text-muted-foreground/60 ml-auto">
                                        {rejectModal.reason.length}/600
                                    </span>
                                </div>
                            </div>

                            {/* Aviso Términos y Condiciones */}
                            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-3">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-400/90 leading-relaxed">
                                    {TC_NOTICE}
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
                            <button
                                onClick={closeRejectModal}
                                disabled={rejectModal.submitting}
                                className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors"
                            >
                                Volver
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                disabled={rejectModal.submitting || !rejectModal.reason.trim()}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                {rejectModal.submitting
                                    ? <><div className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Cancelando…</>
                                    : <><Ban className="h-3.5 w-3.5" /> Confirmar cancelación</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
