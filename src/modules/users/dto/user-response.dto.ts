import { ApiProperty } from '@nestjs/swagger';
import { UserPermissions } from '../types/user-permissions.type';

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
}
