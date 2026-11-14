import { ApiProperty } from '@nestjs/swagger';
import { UserPermissions } from '../types/user-permissions.type';
import { Sucursal } from '../../../entities/sucursal.entity';

export class UserResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    role: string;

    @ApiProperty()
    permissions: UserPermissions;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty({ required: false, nullable: true })
    sucursalId?: string | null;

    @ApiProperty({ required: false, nullable: true })
    sucursal?: Sucursal | null;
}
