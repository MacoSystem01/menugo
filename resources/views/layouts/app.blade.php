<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'MenuGo — Sistema multi-restaurante todo en uno')</title>
    @hasSection('description')
        <meta name="description" content="@yield('description')">
    @endif
    <link rel="icon" href="{{ global_asset('logo-trans.ico') }}" type="image/x-icon">
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
</head>
<body>
    @yield('content')
</body>
</html>
