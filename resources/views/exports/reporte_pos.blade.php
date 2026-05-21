<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
/* ── Reset ─────────────────────────────────────────────────────────────── */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: DejaVu Sans Mono, Courier New, monospace;
    font-size: 7.5px;
    color: #000;
    background: #fff;
    width: 226.77pt;
}

/* ── Utilidades ────────────────────────────────────────────────────────── */
.center  { text-align: center; }
.right   { text-align: right; }
.bold    { font-weight: bold; }
.small   { font-size: 6.5px; }
.divider { border-top: 1px dashed #555; margin: 5px 0; }
.divider-solid { border-top: 1px solid #000; margin: 4px 0; }

/* ── Header ────────────────────────────────────────────────────────────── */
.header {
    padding: 10px 8px 6px;
    text-align: center;
    border-bottom: 1px solid #000;
}
.header .brand {
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}
.header .brand-sub {
    font-size: 6.5px;
    color: #555;
    margin-top: 1px;
    letter-spacing: 0.04em;
}
.header .rpt-title {
    font-size: 8.5px;
    font-weight: bold;
    margin-top: 6px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-top: 1px dashed #999;
    padding-top: 5px;
}

/* ── Meta ──────────────────────────────────────────────────────────────── */
.meta {
    padding: 5px 8px;
    border-bottom: 1px dashed #999;
}
.meta-row {
    display: table;
    width: 100%;
    margin-bottom: 2px;
}
.meta-lbl { display: table-cell; color: #555; width: 50%; }
.meta-val { display: table-cell; font-weight: bold; text-align: right; }

/* ── Tabla ─────────────────────────────────────────────────────────────── */
.section-lbl {
    padding: 4px 8px 2px;
    font-size: 6.5px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #555;
}

table {
    width: 100%;
    border-collapse: collapse;
}

thead tr { border-bottom: 1px solid #000; border-top: 1px solid #000; }
thead th {
    padding: 3px 4px 3px 8px;
    font-size: 6.5px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-align: left;
    background: #f0f0f0;
}
thead th:last-child { padding-right: 8px; }

tbody td {
    padding: 3px 4px 3px 8px;
    font-size: 7px;
    border-bottom: 1px dotted #ccc;
    vertical-align: top;
    word-break: break-word;
}
tbody td:last-child { padding-right: 8px; }
tbody tr:last-child td { border-bottom: none; }

/* Fila total */
.total-row { border-top: 1px solid #000 !important; border-bottom: 1px solid #000 !important; }
.total-row td {
    padding: 4px 4px 4px 8px !important;
    font-weight: bold !important;
    font-size: 7.5px !important;
    border-bottom: none !important;
    border-top: none !important;
    background: #f0f0f0;
}
.total-row td:last-child { padding-right: 8px !important; }

/* Vacío */
.empty-row td {
    text-align: center;
    padding: 12px 8px !important;
    color: #888;
    font-style: italic;
    font-size: 7px !important;
}

/* ── Footer ────────────────────────────────────────────────────────────── */
.footer {
    padding: 6px 8px 10px;
    text-align: center;
    border-top: 1px solid #000;
    margin-top: 4px;
}
.footer .powered {
    font-size: 6.5px;
    font-weight: bold;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}
.footer .gen-time {
    font-size: 6px;
    color: #777;
    margin-top: 2px;
}
</style>
</head>
<body>

{{-- Header --}}
<div class="header">
    <div class="brand">MenuGo</div>
    <div class="brand-sub">Sistema de gestión de restaurante</div>
    <div class="rpt-title">{{ $titulo }}</div>
</div>

{{-- Meta --}}
<div class="meta">
    <div class="meta-row">
        <div class="meta-lbl">Período</div>
        <div class="meta-val">{{ \Carbon\Carbon::parse($desde)->format('d/m/Y') }} — {{ \Carbon\Carbon::parse($hasta)->format('d/m/Y') }}</div>
    </div>
    <div class="meta-row">
        <div class="meta-lbl">Registros</div>
        <div class="meta-val">{{ count($rows) }}</div>
    </div>
    <div class="meta-row">
        <div class="meta-lbl">Generado</div>
        <div class="meta-val">{{ now()->format('d/m/Y H:i') }}</div>
    </div>
</div>

{{-- Section label --}}
<div class="section-lbl">Detalle</div>

{{-- Tabla --}}
<table>
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
            <tr class="empty-row">
                <td colspan="{{ count($headers) }}">Sin registros en el período.</td>
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

{{-- Footer --}}
<div class="footer">
    <div class="powered">menugo.app</div>
    <div class="gen-time">{{ now()->format('d/m/Y H:i:s') }}</div>
</div>

</body>
</html>
