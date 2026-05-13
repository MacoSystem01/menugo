<?php

namespace App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // The domain route group uses {tenant} to match subdomains, but controllers
        // must NOT receive it as a positional argument — Stancl resolves the tenant
        // via $request->getHost() in its own middleware, independently of this param.
        // Binding to null causes parametersWithoutNulls() to drop it before dispatch.
        Route::bind('tenant', fn($value) => null);
    }
}
