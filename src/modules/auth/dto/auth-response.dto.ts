import { ApiProperty } from '@nestjs/swagger';
import { UserPermissions } from '../../users/types/user-permissions.type';

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
}

export class AuthResponseDto {
    @ApiProperty()
    user: UserResponseDto;

    @ApiProperty()
    access_token: string;
}
