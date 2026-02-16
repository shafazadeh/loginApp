import { Injectable } from '@nestjs/common';
import * as handlers from './handlers';

@Injectable()
export class UtilsService {
  public PasswordHandler = handlers.PasswordHandler;
}
