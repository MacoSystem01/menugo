<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>¡Tu publicación ya está activa!</title>
    <style>
        body {
            margin: 0; padding: 0;
            background-color: #f4f4f5;
            font-family: 'Inter', Arial, sans-serif;
            color: #18181b;
        }
        .wrapper {
            max-width: 560px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
            padding: 36px 32px 28px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 800;
            color: #fff;
            letter-spacing: -0.5px;
        }
        .header .emoji {
            font-size: 40px;
            display: block;
            margin-bottom: 12px;
        }
        .body {
            padding: 32px;
        }
        .body p {
            margin: 0 0 16px;
            line-height: 1.65;
            font-size: 15px;
            color: #3f3f46;
        }
        .highlight {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 14px 18px;
            border-radius: 0 8px 8px 0;
            margin: 20px 0;
            font-size: 14px;
            color: #78350f;
        }
        .cta-btn {
            display: block;
            width: fit-content;
            margin: 28px auto 8px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #fff !important;
            text-decoration: none;
            font-weight: 700;
            font-size: 15px;
            padding: 14px 32px;
            border-radius: 9999px;
            letter-spacing: 0.3px;
        }
        .footer {
            text-align: center;
            padding: 20px 32px 28px;
            font-size: 12px;
            color: #a1a1aa;
        }
        .type-badge {
            display: inline-block;
            background: #fef3c7;
            color: #92400e;
            border-radius: 9999px;
            padding: 3px 12px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 6px;
            text-transform: capitalize;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <span class="emoji">🎉</span>
            <h1>¡Tu publicación está activa!</h1>
        </div>
        <div class="body">
            <p>Hola <strong>{{ $contactName }}</strong>,</p>
            <p>
                Nos complace informarte que tu solicitud publicitaria de
                <strong>{{ $businessName }}</strong>
                <span class="type-badge">
                    @if($type === 'banner') Banner Principal
                    @elseif($type === 'slider') Slider de Negocios
                    @else Combo (Banner + Slider)
                    @endif
                </span>
                ha sido revisada y <strong>publicada exitosamente</strong> en la plataforma MenuGo.
            </p>

            <div class="highlight">
                Tu anuncio ya es visible para todos los usuarios que visiten nuestra página principal.
                ¡Miles de personas pueden ver tu negocio ahora mismo!
            </div>

            <p>Puedes verificar tu publicación visitando la página principal de MenuGo:</p>

            <a href="{{ $welcomeUrl }}" class="cta-btn">
                Ver mi publicación en MenuGo →
            </a>

            <p style="margin-top: 24px;">
                Si tienes alguna duda o necesitas realizar cambios, no dudes en contactarnos.
                Gracias por confiar en MenuGo para dar visibilidad a tu negocio.
            </p>
            <p>
                Con gusto,<br>
                <strong>El equipo de MenuGo</strong>
            </p>
        </div>
        <div class="footer">
            Este correo fue generado automáticamente. Por favor no respondas a este mensaje.<br>
            &copy; {{ date('Y') }} MenuGo — Todos los derechos reservados.
        </div>
    </div>
</body>
</html>
