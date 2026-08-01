import { Schema, model, Document, Types } from 'mongoose';

export type UserRole = 'super_admin' | 'organizer' | 'security';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  organizerId: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { type: String, required: true, select: false, minlength: 8 },
    role: { type: String, enum: ['super_admin', 'organizer', 'security'], required: true },
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, organizerId: 1 });

export const User = model<IUser>('User', userSchema);
