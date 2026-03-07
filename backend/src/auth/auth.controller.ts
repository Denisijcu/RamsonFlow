import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login to RansomFlow platform' })
  async login(@Body() body: { email: string; password: string }) {
    const token = await this.authService.login(body.email, body.password);
    if (!token) throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    return { access_token: token, token_type: 'bearer' };
  }
}
