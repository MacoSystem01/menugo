<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111827; background: #fff; }
    .header { background: #1e293b; color: #fff; padding: 16px 20px; margin-bottom: 20px; }
    .header h1 { font-size: 16px; font-weight: bold; }
    .header p  { font-size: 10px; color: #94a3b8; margin-top: 3px; }
    .meta { padding: 0 20px 14px; display: flex; gap: 20px; font-size: 10px; color: #6b7280; border-bottom: 1px solid #e5e7eb; margin-bottom: 16px; }
    .meta strong { color: #111827; }
    table { width: 100%; border-collapse: collapse; margin: 0 20px; width: calc(100% - 40px); }
    thead tr { background: #f1f5f9; }
    thead th { padding: 8px 10px; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.03em; color: #475569; border-bottom: 2px solid #cbd5e1; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 10px; vertical-align: top; }
    .footer { margin-top: 24px; padding: 12px 20px 0; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; text-align: center; }
    .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
    .badge-ok      { background: #d1fae5; color: #065f46; }
    .badge-bajo    { background: #fef3c7; color: #92400e; }
    .badge-agotado { background: #fee2e2; color: #991b1b; }
    .badge-vencido { background: #fce7f3; color: #9d174d; }
    .badge-paid    { background: #d1fae5; color: #065f46; }
    .badge-partial { background: #fef3c7; color: #92400e; }
    .badge-unpaid  { background: #f3f4f6; color: #6b7280; }
    .badge-delivered  { background: #dbeafe; color: #1e40af; }
    .badge-cancelled  { background: #fee2e2; color: #991b1b; }
    .right { text-align: right; }
    .center { text-align: center; }
    .total-row { background: #1e293b !important; color: #fff; font-weight: 700; }
    .total-row td { color: #fff; border: none; padding: 9px 10px; }
</style>
</head>
<body>

<div class="header">
    <h1>{{ $titulo }}</h1>
    <p>Generado el {{ now()->format('d/m/Y H:i') }}</p>
</div>

<div class="meta">
    <span>Período: <strong>{{ \Carbon\Carbon::parse($desde)->format('d/m/Y') }} — {{ \Carbon\Carbon::parse($hasta)->format('d/m/Y') }}</strong></span>
    <span>Registros: <strong>{{ count($rows) }}</strong></span>
</div>

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
                    <td class="{{ $h['align'] ?? '' }}">
                        @php $val = $row[$i] ?? ''; @endphp
                        @if(isset($h['badge']) && $h['badge'] && $val)
                            <span class="badge badge-{{ $h['badgeMap'][$val] ?? '' }}">{{ $h['labelMap'][$val] ?? $val }}</span>
                        @else
                            {{ $val }}
                        @endif
                    </td>
                @endforeach
            </tr>
        @empty
            <tr><td colspan="{{ count($headers) }}" class="center" style="padding:20px;color:#6b7280;">Sin registros en el período seleccionado.</td></tr>
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

<div class="footer">MenuGo · Reporte generado automáticamente · {{ now()->format('d/m/Y H:i:s') }}</div>

</body>
</html>
