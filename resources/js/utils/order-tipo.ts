export type OrderTipo = 'mesa' | 'domicilio' | 'mostrador' | string;

/** Etiqueta corta del tipo de pedido */
export function tipoLabel(tipo: OrderTipo): string {
    switch (tipo) {
        case 'mesa':      return 'Mesa';
        case 'domicilio': return 'Domicilio';
        case 'mostrador': return 'Mostrador';
        default:          return tipo;
    }
}

/** Detalle contextual: número de mesa, dirección, o turno */
export function tipoDetalle(
    tipo: OrderTipo,
    mesa?: number | null,
    turno?: number | null,
): string {
    switch (tipo) {
        case 'mesa':      return `Mesa ${mesa ?? '—'}`;
        case 'domicilio': return 'Domicilio';
        case 'mostrador': return turno ? `Turno #${turno}` : 'Mostrador';
        default:          return tipo;
    }
}

/** Clases Tailwind para el badge del tipo de pedido */
export function tipoBadgeCls(tipo: OrderTipo): string {
    switch (tipo) {
        case 'mesa':      return 'bg-accent/15 text-accent border-accent/30';
        case 'domicilio': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
        case 'mostrador': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
        default:          return 'bg-muted text-muted-foreground border-border';
    }
}
