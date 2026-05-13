<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\RedirectIfAuthenticated as BaseRedirectIfAuthenticated;
use Illuminate\Http\Request;

class RedirectIfAuthenticated extends BaseRedirectIfAuthenticated
{
    // In domain-based multi-tenancy, route('dashboard') fails because the {tenant}
    // domain parameter cannot be resolved outside of a routed request context.
    // A plain path always resolves relative to the current domain, which is correct.
    protected function defaultRedirectUri(): string
    {
        return '/dashboard';
    }
}
