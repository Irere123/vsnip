import type { AuthTokens } from '../../../controllers/auth.controller';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface User extends AuthTokens {}
  }
}
