import { Component, Inject }     from '@nestjs/common';
import { IBootService } from '../boot-service.interface';
import { INestApplication } from '@nestjs/common/interfaces';

import { AuthModule } from '../../auth/auth.module';
import { HttpClaimsGuard } from '../../auth/gaurds/http-claims.guard';

@Component()
export class ConfigureAuthService implements IBootService {
  constructor() {}
  
  async boot(app: INestApplication, production: boolean): Promise<boolean> {
    
    console.log("Booting Server - Configuring Authorisation - Claims Guard");

    const authGuard = app.select(AuthModule)
                         .get(HttpClaimsGuard);

    app.useGlobalGuards(authGuard);

    return true;
  }

}