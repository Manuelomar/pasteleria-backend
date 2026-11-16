import { Controller, Get, Post, Body, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from '../../decorators/public.decorator';
import { RequestWithUser } from '../../common/interfaces/auth-user.interface';

@ApiTags('Autenticación')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, type: AuthResponseDto })
    async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
        const user = await this.authService.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }
        return this.authService.login(user);
    }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    async getProfile(@Request() req: RequestWithUser) {
        return this.authService.getProfile(req.user?.id || req.user?.username || '');
    }
}
