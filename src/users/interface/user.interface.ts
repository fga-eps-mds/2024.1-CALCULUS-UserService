import { Document } from 'mongoose';

export interface User extends Document {
  name: string;
  email: string;
  username: string;
  password?: string;
  verificationToken?: string;
  isVerified?: boolean;
}
