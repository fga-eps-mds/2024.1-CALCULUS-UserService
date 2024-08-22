import mongoose, { Document } from 'mongoose';
import { UserRole } from '../dtos/user-role.enum';

export interface User extends Document {
  name: string;
  email: string;
  username: string;
  password?: string;
  verificationToken?: string;
  isVerified?: boolean;
  role?: UserRole;
  journeys?: mongoose.Types.ObjectId[];
  subscribedJourneys?: mongoose.Types.ObjectId[];
}
