import { Schema, model, Document, Types } from 'mongoose';

export type CheckinResult = 'success' | 'duplicate' | 'undo' | 'reentry';
export type CheckinMethod = 'camera' | 'manual';

export interface ICheckinLog extends Document {
  eventId: Types.ObjectId;
  guestId: Types.ObjectId;
  result: CheckinResult;
  scannedBy: Types.ObjectId;
  method: CheckinMethod;
  createdAt: Date;
  updatedAt: Date;
}

const checkinLogSchema = new Schema<ICheckinLog>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    guestId: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
    result: { type: String, enum: ['success', 'duplicate', 'undo', 'reentry'], required: true },
    scannedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    method: { type: String, enum: ['camera', 'manual'], required: true },
  },
  { timestamps: true }
);

checkinLogSchema.index({ eventId: 1, createdAt: -1 });
checkinLogSchema.index({ eventId: 1, result: 1, createdAt: -1 });
checkinLogSchema.index({ guestId: 1 });

export const CheckinLog = model<ICheckinLog>('CheckinLog', checkinLogSchema);
