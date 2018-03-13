import * as jwt from 'jsonwebtoken';
import { Component, Logger } from '@nestjs/common'

import { AuthConfig } from '../model/interfaces/auth-config.interface';
import { AuthConfigService } from './auth-config.service';

import { RefreshToken } from '../model/interfaces/refresh-token.interface';
import { RefreshTokenRepository } from '../model/repositories/refresh-token.repository';

import { ObjectId } from 'bson';

import { UserService } from '../../user/model/services/user.service';
import { RolesService } from './roles.service';

import { BearerToken } from 'elewa-shared/token/bearer-token.interface';

/**
 * The BearerService is responsible for initial issue, re-issueing and verifying bearer tokens. 
 *  A refresh token is needed to authorise re-issueing.
 * 
 * Issueing a bearer token is a heavy operation (4 database calls), 
 *    but is amortised very quick since it only happens on login and every 10 minutes.
 */
@Component()
export class BearerTokenService {

  constructor(private _authConfigService: AuthConfigService, 
              private _refreshTokenRepository: RefreshTokenRepository,
              private _userService: UserService,
              private _roleService: RolesService) {}

  public async issue(refreshToken: string): Promise<string | false> {
    Logger.log("Issueing Bearer Token");

    var authConfig = await this._authConfigService.getAuthConfig();

    try {
            // 1. Verify the token is valid (check signature)
      Logger.log("Verifying Refresh Token", "BearerTokenService.issue");
      let rToken = <RefreshToken> jwt.verify(refreshToken, authConfig.refreshTokenSecret);

      if(await this._verifyTokenLogic(rToken)) 
      {
        Logger.log("Refresh Token verified and Valid", "BearerTokenService.issue");
        const payload = await this._createBearerPayload(rToken.userId);
        
        Logger.log("Payload Generated", "BearerTokenService.issue");
        const signed = await jwt.sign(payload, authConfig.bearerTokenSecret, { expiresIn: authConfig.bearerTokenExpiry });

        return signed;
      }
    }
    catch(err) {
      Logger.error(err);
    }

    // Error or Verification or issueing failed.
    
    Logger.log("Token unverified");
    return false;
  }

  /**
   * Verify if the secret in this refresh token matches the one in the database. 
   *  If so, this refresh token is valid (since signature has already been verified) 
   * 
   * This step is important since we can revoke refresh tokens (e.g. "log me out on all devices", user ban, ..). 
   *    If a refresh token has been revoked, this verification will fail.
   */
  private async _verifyTokenLogic(rToken: RefreshToken) {
    let dbToken = await this._refreshTokenRepository.trySingle({ _id: rToken._id });

    Logger.log("Comparing token handshake to database handshake", "BearerTokenService._verifyTokenLogic");
    Logger.log((dbToken ? dbToken.handshake : "NotFound"), "Db Token");
    Logger.log(rToken.handshake, "R Token");

    return dbToken && dbToken.handshake === rToken.handshake;
  }

  /**
   * Issues a bearer token for that user.
   * 
   * Bearer Token contains user id, profile and claims.
   *  It is used for stateless authentication and access to user info without constant roundtrip to the database on the server.
   * 
   * On each bearer refresh, the user object is fetched and role is examined.
   * Based on that role, we then fetch the corresponding claims.
   */
  private async _createBearerPayload(userId: ObjectId): Promise<BearerToken> {
    const user = await this._userService.findById(userId);

    if(!user)
      throw new Error("Bearer Token Service - createPayload: No user for id");

    // Refresh claims in case role was changed or claims for role have been updated.
    const claims = await this._roleService.getClaims(user.role);

    return { 
      userId: userId,
      user: user.profile,
      
      claims,

      issueDate: new Date()
    };
  }

}