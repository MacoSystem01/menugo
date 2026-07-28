interface PaymentDetail {
    titular?: string;
    numero?: string;
    banco?: string;
    tipo_cuenta?: string;
    link?: string;
    nota?: string;
    qr_image_path?: string;
}

interface Props {
    method: string;
    detail: PaymentDetail | undefined;
    total: number;
    primary: string;
    text: string;
    fmt: (n: number) => string;
}

/** Bloque de instrucciones de pago por método, usado en el modal de éxito de /carta y en la página de seguimiento del pedido. */
export default function PaymentDetailBlock({ method, detail, total, primary, text, fmt }: Props) {
    const boxStyle = { borderColor: `${primary}40`, backgroundColor: `${primary}08` };
    const labelStyle = { color: primary };

    if (method === 'nequi') {
        const phone = detail?.numero?.replace(/\D/g, '');
        const amount = Math.round(total);
        const nequiUrl = detail?.link
            ? detail.link
            : phone
                ? `https://www.nequi.com.co/cobrar?cuenta=${phone}&monto=${amount}`
                : null;
        return (
            <div className="w-full mb-5 rounded-2xl border p-4 space-y-3 text-left" style={boxStyle}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={labelStyle}>Paga con Nequi</p>
                {detail?.titular && (
                    <p className="text-sm" style={{ color: text }}>
                        <span className="opacity-60">Titular: </span><strong>{detail.titular}</strong>
                    </p>
                )}
                {phone && (
                    <p className="text-sm" style={{ color: text }}>
                        <span className="opacity-60">Número: </span>
                        <strong className="font-mono tracking-wider">{detail?.numero}</strong>
                    </p>
                )}
                <p className="text-sm" style={{ color: text }}>
                    <span className="opacity-60">Monto a pagar: </span><strong>{fmt(total)}</strong>
                </p>
                {detail?.nota && <p className="text-xs opacity-60" style={{ color: text }}>{detail.nota}</p>}
                
                {detail?.qr_image_path ? (
                    <div className="mt-3">
                        <img 
                            src={`/storage/${detail.qr_image_path}`} 
                            alt="QR Nequi" 
                            className="w-full max-w-[200px] mx-auto rounded-xl border object-contain"
                            style={{ borderColor: `${primary}30` }}
                        />
                    </div>
                ) : (
                    <p className="text-xs opacity-60 mt-1" style={{ color: text }}>
                        Realiza la transferencia al número indicado y menciona tu pedido.
                    </p>
                )}
            </div>
        );
    }

    if (method === 'daviplata') {
        const phone = detail?.numero?.replace(/\D/g, '');
        const daviplataUrl = detail?.link ?? null;
        return (
            <div className="w-full mb-5 rounded-2xl border p-4 space-y-3 text-left" style={boxStyle}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={labelStyle}>Paga con Daviplata</p>
                {detail?.titular && (
                    <p className="text-sm" style={{ color: text }}>
                        <span className="opacity-60">Titular: </span><strong>{detail.titular}</strong>
                    </p>
                )}
                {phone && (
                    <p className="text-sm" style={{ color: text }}>
                        <span className="opacity-60">Número: </span>
                        <strong className="font-mono tracking-wider">{detail?.numero}</strong>
                    </p>
                )}
                <p className="text-sm" style={{ color: text }}>
                    <span className="opacity-60">Monto a pagar: </span><strong>{fmt(total)}</strong>
                </p>
                {detail?.nota && <p className="text-xs opacity-60" style={{ color: text }}>{detail.nota}</p>}
                {daviplataUrl ? (
                    <a
                        href={daviplataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold mt-1"
                        style={{ backgroundColor: primary, color: '#ffffff' }}
                    >
                        Abrir Daviplata para pagar →
                    </a>
                ) : (
                    <p className="text-xs opacity-60" style={{ color: text }}>
                        Realiza la transferencia al número indicado y menciona tu pedido.
                    </p>
                )}
            </div>
        );
    }

    if (method === 'pse') {
        return (
            <div className="w-full mb-5 rounded-2xl border p-4 space-y-3 text-left" style={boxStyle}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={labelStyle}>Paga por PSE</p>
                {detail?.banco && (
                    <p className="text-sm" style={{ color: text }}>
                        <span className="opacity-60">Banco: </span><strong>{detail.banco}</strong>
                    </p>
                )}
                {detail?.titular && (
                    <p className="text-sm" style={{ color: text }}>
                        <span className="opacity-60">Titular: </span><strong>{detail.titular}</strong>
                    </p>
                )}
                {detail?.numero && (
                    <p className="text-sm" style={{ color: text }}>
                        <span className="opacity-60">Cuenta: </span>
                        <strong className="font-mono tracking-wider">{detail.numero}</strong>
                        {detail.tipo_cuenta && <span className="ml-1 opacity-60 text-xs">({detail.tipo_cuenta})</span>}
                    </p>
                )}
                <p className="text-sm" style={{ color: text }}>
                    <span className="opacity-60">Monto a pagar: </span><strong>{fmt(total)}</strong>
                </p>
                <p className="text-xs opacity-60" style={{ color: text }}>
                    Realiza la transferencia PSE e indica tu nombre al negocio para confirmar el pago.
                </p>
            </div>
        );
    }

    if (method === 'transferencia') {
        return (
            <div className="w-full mb-5 rounded-2xl border p-4 space-y-3 text-left" style={boxStyle}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={labelStyle}>Transferencia bancaria</p>
                {detail?.banco && (
                    <p className="text-sm" style={{ color: text }}>
                        <span className="opacity-60">Banco: </span><strong>{detail.banco}</strong>
                    </p>
                )}
                {detail?.titular && (
                    <p className="text-sm" style={{ color: text }}>
                        <span className="opacity-60">Titular: </span><strong>{detail.titular}</strong>
                    </p>
                )}
                {detail?.numero && (
                    <p className="text-sm" style={{ color: text }}>
                        <span className="opacity-60">Cuenta: </span>
                        <strong className="font-mono tracking-wider">{detail.numero}</strong>
                        {detail.tipo_cuenta && <span className="ml-1 opacity-60 text-xs">({detail.tipo_cuenta})</span>}
                    </p>
                )}
                <p className="text-sm" style={{ color: text }}>
                    <span className="opacity-60">Monto a pagar: </span><strong>{fmt(total)}</strong>
                </p>
                {detail?.nota && <p className="text-xs opacity-60" style={{ color: text }}>{detail.nota}</p>}
                {!detail?.banco && !detail?.numero && (
                    <p className="text-xs opacity-60" style={{ color: text }}>
                        Consulta los datos de transferencia directamente con el negocio.
                    </p>
                )}
            </div>
        );
    }

    if (method === 'tarjeta') {
        if (!detail?.nota) return null;
        return (
            <div className="w-full mb-5 rounded-2xl border p-4 space-y-2 text-left" style={boxStyle}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={labelStyle}>Pago con tarjeta</p>
                <p className="text-sm" style={{ color: text, opacity: 0.75 }}>{detail.nota}</p>
            </div>
        );
    }

    return null;
}
