<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
/* ── Reset ─────────────────────────────────────────────────────────────── */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: DejaVu Sans, Arial, sans-serif;
    font-size: 10px;
    color: #1e293b;
    background: #ffffff;
    padding-bottom: 44px;
}

/* ── Footer fijo ───────────────────────────────────────────────────────── */
.page-footer {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 28px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
}
.footer-inner {
    display: table;
    width: 100%;
    padding: 0 28px;
    height: 28px;
}
.footer-l { display: table-cell; vertical-align: middle; font-size: 7.5px; color: #94a3b8; }
.footer-r { display: table-cell; vertical-align: middle; text-align: right; font-size: 7.5px; color: #94a3b8; }

/* ── Header ────────────────────────────────────────────────────────────── */
.header {
    background: #0f172a;
    padding: 20px 28px 18px;
}
.header-row { display: table; width: 100%; }
.header-l   { display: table-cell; vertical-align: bottom; }
.header-r   { display: table-cell; vertical-align: top; text-align: right; }

.brand      { font-size: 8px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.14em; }
.brand-sub  { font-size: 7.5px; color: #475569; margin-top: 1px; }
.rpt-title  { font-size: 19px; font-weight: 700; color: #f8fafc; margin-top: 10px; letter-spacing: -0.01em; line-height: 1.2; }

.gen-label  { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #475569; }
.gen-val    { font-size: 9.5px; color: #94a3b8; margin-top: 3px; }

/* ── Accent bar ────────────────────────────────────────────────────────── */
.accent-bar { height: 3px; background: #3b82f6; }

/* ── Meta strip ────────────────────────────────────────────────────────── */
.meta-strip { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 11px 28px; }
.meta-row   { display: table; width: 100%; }
.meta-cell  { display: table-cell; padding-right: 36px; vertical-align: top; }

.meta-label { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; }
.meta-val   { font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 3px; }
.meta-sm    { font-size: 10px; font-weight: 600; color: #475569; margin-top: 3px; }
.dot-ok     { color: #16a34a; }

/* ── Section label ─────────────────────────────────────────────────────── */
.section-lbl {
    padding: 13px 28px 5px;
    font-size: 7px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.13em;
    color: #94a3b8;
    border-bottom: 1px solid #f1f5f9;
}

/* ── Tabla principal ───────────────────────────────────────────────────── */
.data-table { width: 100%; border-collapse: collapse; }

.data-table thead tr  { background: #1e293b; }
.data-table thead th  {
    padding: 9px 10px 9px 14px;
    text-align: left;
    font-size: 7px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #94a3b8;
    border-right: 1px solid #334155;
}
.data-table thead th:first-child { padding-left: 28px; }
.data-table thead th:last-child  { border-right: none; }

.data-table tbody tr:nth-child(odd)  { background: #ffffff; }
.data-table tbody tr:nth-child(even) { background: #f8fafc; }

.data-table tbody td {
    padding: 7.5px 10px 7.5px 14px;
    font-size: 9.5px;
    color: #334155;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
}
.data-table tbody td:first-child { padding-left: 28px; }
.data-table tbody tr:last-child td { border-bottom: none; }

/* ── Fila de totales ───────────────────────────────────────────────────── */
.total-row            { background: #0f172a !important; }
.total-row td         { color: #f1f5f9 !important; font-weight: 700 !important; border: none !important; padding-top: 10px !important; padding-bottom: 10px !important; }
.total-row td:first-child { padding-left: 28px !important; }

/* ── Alineación ────────────────────────────────────────────────────────── */
.right  { text-align: right; }
.center { text-align: center; }

/* ── Badges ────────────────────────────────────────────────────────────── */
.badge { display: inline-block; padding: 2px 7px; border-radius: 20px; font-size: 7.5px; font-weight: 700; letter-spacing: 0.04em; }
.badge-ok, .badge-paid, .badge-delivered { background: #d1fae5; color: #065f46; }
.badge-bajo, .badge-partial              { background: #fef3c7; color: #92400e; }
.badge-agotado, .badge-unpaid            { background: #fee2e2; color: #991b1b; }
.badge-vencido, .badge-cancelled         { background: #fce7f3; color: #9d174d; }

/* ── Empty state ───────────────────────────────────────────────────────── */
.empty-cell { text-align: center !important; padding: 36px 12px !important; color: #94a3b8 !important; font-size: 11px !important; }
</style>
</head>
<body>

{{-- Footer fijo --}}
<div class="page-footer">
    <div class="footer-inner">
        <div class="footer-l">MenuGo · Sistema de gestión de restaurante · Documento generado automáticamente</div>
        <div class="footer-r">{{ now()->format('d/m/Y H:i:s') }}</div>
    </div>
</div>

{{-- Header --}}
<div class="header">
    <div class="header-row">
        <div class="header-l">
            <div class="brand">MenuGo</div>
            <div class="brand-sub">Sistema de gestión de restaurante</div>
            <div class="rpt-title">{{ $titulo }}</div>
        </div>
        <div class="header-r">
            <div class="gen-label">Generado</div>
            <div class="gen-val">{{ now()->format('d/m/Y H:i') }}</div>
        </div>
    </div>
</div>
<div class="accent-bar"></div>

{{-- Meta strip --}}
<div class="meta-strip">
    <div class="meta-row">
        <div class="meta-cell">
            <div class="meta-label">Período</div>
            <div class="meta-val">
                {{ \Carbon\Carbon::parse($desde)->format('d/m/Y') }}
                &nbsp;—&nbsp;
                {{ \Carbon\Carbon::parse($hasta)->format('d/m/Y') }}
            </div>
        </div>
        <div class="meta-cell">
            <div class="meta-label">Registros</div>
            <div class="meta-val">{{ count($rows) }}</div>
        </div>
        <div class="meta-cell">
            <div class="meta-label">Estado</div>
            <div class="meta-sm"><span class="dot-ok">&#9679;</span> Documento oficial</div>
        </div>
    </div>
</div>

{{-- Section label --}}
<div class="section-lbl">Detalle del reporte</div>

{{-- Tabla --}}
<table class="data-table">
    <thead>
        <tr>
            @foreach($headers as $h)
                <th class="{{ $h['align'] ?? '' }}">{{ $h['label'] }}</th>
            @endforeach
        </tr>
    </thead>
    <tbody>
        @forelse($rows as $row)
            <tr>
                @foreach($headers as $i => $h)
                    <td class="{{ $h['align'] ?? '' }}">{{ $row[$i] ?? '' }}</td>
                @endforeach
            </tr>
        @empty
            <tr>
                <td colspan="{{ count($headers) }}" class="empty-cell">
                    Sin registros en el período seleccionado.
                </td>
            </tr>
        @endforelse

        @if(isset($totals) && $totals)
            <tr class="total-row">
                @foreach($totals as $t)
                    <td class="{{ $t['align'] ?? '' }}">{{ $t['value'] }}</td>
                @endforeach
            </tr>
        @endif
    </tbody>
</table>

</body>
</html>
