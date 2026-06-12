import { Controller, Get, Post, Body, Param, Put, Query, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserPermissions } from '../../entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @ApiOperation({ summary: 'Get all users' })
    @ApiResponse({ status: 200, type: [UserResponseDto] })
    findAll(): Promise<UserResponseDto[]> {
        return this.usersService.findAll();
    }

    @Get('paged')
    @ApiOperation({ summary: 'Get all users with pagination' })
    @ApiResponse({ status: 200 })
    findAllPaged(
        @Query() paginationDto: PaginationDto,
        @Query('search') search?: string,
        @Query('role') role?: string,
        @Query('activo') activo?: string,
    ): Promise<PaginatedResponseDto<UserResponseDto>> {
        const isActivo = activo === 'true' ? true : activo === 'false' ? false : undefined;
        return this.usersService.findAllPaged(paginationDto, search, role, isActivo);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new user' })
    @ApiBody({ type: CreateUserDto })
    @ApiResponse({ status: 201, type: UserResponseDto })
    create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
        return this.usersService.create(createUserDto);
    }

    @Put(':id/permissions')
    @ApiOperation({ summary: 'Update user permissions' })
    @ApiBody({ type: UserPermissions })
    @ApiResponse({ status: 200, type: UserResponseDto })
    updatePermissions(@Param('id') id: string, @Body() permissions: UserPermissions): Promise<UserResponseDto> {
        return this.usersService.updatePermissions(id, permissions);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a user' })
    update(@Param('id') id: string, @Body() data: any): Promise<UserResponseDto> {
        return this.usersService.update(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a user' })
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
