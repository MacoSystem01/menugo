<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="{{ asset('logo-trans.ico') }}" />
    @inertiaHead
    @viteReactRefresh
    @vite('resources/js/app.tsx')
</head>
<body class="antialiased">
    @inertia
</body>
</html>
