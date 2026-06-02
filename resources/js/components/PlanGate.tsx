import { usePlan } from '@/hooks/use-plan';
import { ReactNode } from 'react';

interface PlanGateProps {
    feature:   string;     // 'orders' | 'analytics' | 'delivery'
    children:  ReactNode;  // contenido a mostrar si tiene acceso
    fallback?: ReactNode;  // contenido alternativo (por defecto: banner de upgrade)
}

function UpgradeBanner({ feature }: { feature: string }) {
    const { requiredPlanFor, planName } = usePlan();
    return (
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
            <div className="text-3xl">🔒</div>
            <h3 className="font-semibold text-foreground">
                Funcionalidad del plan {requiredPlanFor(feature)}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Estás en el plan <strong>{planName()}</strong>. Actualiza al plan{' '}
                <strong>{requiredPlanFor(feature)}</strong> para acceder a esta funcionalidad.
            </p>
            <a
                href="https://wa.me/573172623919?text=Quiero%20actualizar%20mi%20plan%20de%20Men%C3%BAGo"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-warm px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition"
            >
                Actualizar plan →
            </a>
        </div>
    );
}

export function PlanGate({ feature, children, fallback }: PlanGateProps) {
    const { can } = usePlan();
    if (can(feature)) return <>{children}</>;
    return <>{fallback ?? <UpgradeBanner feature={feature} />}</>;
}
