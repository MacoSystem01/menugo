@extends('layouts.app')
@section('title', $title . ' — MenuGo')

@section('content')
<x-app-shell variant="restaurant" :title="$title">
    <div class="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div class="grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 mb-6">
            <x-icon :name="$icon" class="h-9 w-9 text-primary" />
        </div>
        <h2 class="font-display text-2xl font-bold mb-2">{{ $title }}</h2>
        <p class="text-muted-foreground text-sm max-w-xs">
            Esta sección está en desarrollo. Pronto estará disponible.
        </p>
    </div>
</x-app-shell>
@endsection
