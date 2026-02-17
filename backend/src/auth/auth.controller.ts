import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('name') name: string,
  ) {
    return this.authService.register(email, password, name);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.login(email, password);
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  async validateToken(@Request() req) {
    return {
      valid: true,
      user: req.user,
    };
  }
}