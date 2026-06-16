import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserPermissions } from '../../entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    private mapToResponseDto(user: User): UserResponseDto {
        const { password, ...result } = user;
        return result as UserResponseDto;
    }

    async create(createUserDto: any): Promise<UserResponseDto> {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        
        const user = this.usersRepository.create({
            ...createUserDto,
            password: hashedPassword,
        } as User);

        const savedUser = await this.usersRepository.save(user);
        return this.mapToResponseDto(savedUser);
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { username },
            select: ['id', 'username', 'password', 'name', 'role', 'permissions'],
        });
    }

    async findAll(): Promise<UserResponseDto[]> {
        const users = await this.usersRepository.find();
        return users.map(user => this.mapToResponseDto(user));
    }

    async findAllPaged(
        paginationDto: PaginationDto,
        search?: string,
        role?: string,
        activo?: boolean
    ): Promise<PaginatedResponseDto<UserResponseDto>> {
        const pageVal = Number(paginationDto.pageNumber || 1);
        const sizeVal = Number(paginationDto.pageSize || 10);
        const skip = (pageVal - 1) * sizeVal;

        const queryBuilder = this.usersRepository.createQueryBuilder('user');

        if (search) {
            queryBuilder.andWhere(
                '(LOWER(user.name) LIKE LOWER(:search) OR LOWER(user.username) LIKE LOWER(:search))',
                { search: `%${search}%` }
            );
        }

        if (role && role !== 'todos') {
            queryBuilder.andWhere('user.role = :role', { role });
        }

        queryBuilder.orderBy('user.name', 'ASC');
        queryBuilder.skip(skip);
        queryBuilder.take(sizeVal);

        const [users, total] = await queryBuilder.getManyAndCount();
        const data = users.map(user => this.mapToResponseDto(user));
        return new PaginatedResponseDto(data, total, pageVal, sizeVal);
    }

    async updatePermissions(id: string, permissions: UserPermissions): Promise<UserResponseDto> {
        await this.usersRepository.update(id, { permissions });
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return this.mapToResponseDto(user);
    }

    async update(id: string, data: any): Promise<UserResponseDto> {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
        await this.usersRepository.update(id, data);
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return this.mapToResponseDto(user);
    }

    async remove(id: string) {
        await this.usersRepository.delete(id);
        return { deleted: true };
    }
}
