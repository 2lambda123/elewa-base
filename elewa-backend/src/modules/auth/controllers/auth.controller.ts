import { Controller, Post, HttpStatus, HttpCode, Get, Body, HttpException } from '@nestjs/common';

import { AuthService } from '../services/auth.service';

import { AuthRequestDto } from '../model/interfaces/dto/auth-request.dto.interface';
import { AuthResponseDto } from '../model/interfaces/dto/auth-response.dto.interface';
import { RegisterRequestDto } from '../model/interfaces/dto/register-request.dto.interface';
import { BearerRequestDto } from '../model/interfaces/dto/bearer-request.dto.interface';
import { Anonymous } from '../gaurds/anonymous.decorator';

@Controller('auth')
@Anonymous() // Everyone can access this controller.
export class AuthController
{
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  public async register(@Body() req: RegisterRequestDto) {
    try {
      let auth = this.authService.register(req);

      // Registration success. Next expected server call is login
      return true;
    }
   catch(e) {
     console.error(e);
     throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
   }
  }

  @Post('authenticate')
  public async authenticate(@Body() req: AuthRequestDto) {
    let auth = this.authService.authenticate(req);

    if(! auth) 
      throw new HttpException('Combination of username and password incorrect.', HttpStatus.BAD_REQUEST);
    
    return auth;
  }

  @Post('token')
  public async token(@Body() req: BearerRequestDto) {
    let token = this.authService.issueBearer(req);

    if(! token) 
      throw new HttpException('Refresh token has expired or has been revoked. Please re-authenticate.', HttpStatus.BAD_REQUEST);
    
    return token;
  }
}