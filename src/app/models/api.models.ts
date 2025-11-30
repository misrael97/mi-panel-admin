// Interfaces para los modelos de la API

export interface Usuario {
    id: number;
    name: string;
    email: string;
    role_id: number;
    sucursal_id?: number | null;
    role?: {
        id: number;
        name: string;
    };
    negocio?: Sucursal;
    created_at?: string;
    updated_at?: string;
}

export interface Sucursal {
    id: number;
    nombre: string;
    direccion?: string;
    telefono?: string;
    horario?: string;
    agente_id?: number | null;
    agente?: Usuario;
    created_at?: string;
    updated_at?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: Usuario;
}

export interface ApiResponse<T> {
    data?: T;
    message?: string;
    errors?: any;
}
