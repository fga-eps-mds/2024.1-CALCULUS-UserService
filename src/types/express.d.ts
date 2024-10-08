import { User } from 'src/users/interface/user.interface';

declare global {
  namespace Express {
    interface Request {
      user?: User & { accessToken?: string };
    }
  }
}
