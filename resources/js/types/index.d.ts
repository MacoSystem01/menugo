export interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    active: boolean;
    roles: string[];
    permissions: string[];
}

export interface PageProps {
    auth: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}
