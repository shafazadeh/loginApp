import { Injectable } from '@nestjs/common';
import * as handlers from './handlers';

@Injectable()
export class UtilsService {
  public PasswordHandler = handlers.PasswordHandler;
  public Fingerprint = handlers.Fingerprint;
  public JwtHandler = handlers.JwtHandler;
}
