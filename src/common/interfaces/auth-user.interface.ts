import { UserRole } from '../../entities/user.entity';

export interface AuthUser {
    id: string;
    username: string;
    role: UserRole;
    sucursalId?: string | null;
    isProvider?: boolean;
}

export interface RequestWithUser {
    user?: AuthUser;
}
