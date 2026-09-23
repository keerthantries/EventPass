import { Schema, model, Document, Types } from 'mongoose';

export type InvitationStatus = 'not_sent' | 'sent' | 'opened';
export type RsvpStatus = 'pending' | 'accepted' | 'declined' | 'maybe';
export type ApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected';
export type AttendanceStatus = 'absent' | 'present';

export interface IGuest extends Document {
  eventId: Types.ObjectId;
  categoryId: Types.ObjectId | null;
  partyId: Types.ObjectId | null;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  side?: string;
  isVip: boolean;
  isImmediateFamily: boolean;

  invitationToken?: string;
  invitationStatus: InvitationStatus;
  invitationSentAt?: Date;
  invitationOpenedAt?: Date;

  rsvpStatus: RsvpStatus;
  rsvpRespondedAt?: Date;

  approvalStatus: ApprovalStatus;

  qrToken?: string;
  qrGeneratedAt?: Date;

  attendanceStatus: AttendanceStatus;
  checkInTime?: Date;
  checkedInBy?: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

const guestSchema = new Schema<IGuest>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    partyId: { type: Schema.Types.ObjectId, ref: 'Party', default: null },
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    firstName: { type: String, trim: true, maxlength: 50 },
    lastName: { type: String, trim: true, maxlength: 50 },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: { type: String, trim: true, maxlength: 20 },
    notes: { type: String, maxlength: 1000 },
    side: { type: String, trim: true, maxlength: 50 },
    isVip: { type: Boolean, default: false },
    isImmediateFamily: { type: Boolean, default: false },

    invitationToken: { type: String },
    invitationStatus: { type: String, enum: ['not_sent', 'sent', 'opened'], default: 'not_sent' },
    invitationSentAt: Date,
    invitationOpenedAt: Date,

    rsvpStatus: { type: String, enum: ['pending', 'accepted', 'declined', 'maybe'], default: 'pending' },
    rsvpRespondedAt: Date,

    approvalStatus: {
      type: String,
      enum: ['not_required', 'pending', 'approved', 'rejected'],
      default: 'not_required',
    },

    qrToken: { type: String },
    qrGeneratedAt: Date,

    attendanceStatus: { type: String, enum: ['absent', 'present'], default: 'absent' },
    checkInTime: Date,
    checkedInBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

guestSchema.index({ eventId: 1, rsvpStatus: 1 });
guestSchema.index({ eventId: 1, attendanceStatus: 1 });
guestSchema.index({ eventId: 1, categoryId: 1 });
guestSchema.index({ eventId: 1, invitationStatus: 1 });
guestSchema.index({ eventId: 1, categoryId: 1, attendanceStatus: 1 });
guestSchema.index({ eventId: 1, categoryId: 1, rsvpStatus: 1 });
guestSchema.index({ eventId: 1, attendanceStatus: 1, checkInTime: -1 });
guestSchema.index({ eventId: 1, side: 1 });
guestSchema.index({ eventId: 1, partyId: 1 });
guestSchema.index({ categoryId: 1 });
guestSchema.index({ fullName: 'text', email: 'text', phone: 'text' });
guestSchema.index({ qrToken: 1 }, { unique: true, sparse: true });
guestSchema.index({ invitationToken: 1 }, { unique: true, sparse: true });
guestSchema.index({ eventId: 1, email: 1 });

export const Guest = model<IGuest>('Guest', guestSchema);
