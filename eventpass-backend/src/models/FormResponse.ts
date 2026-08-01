import { Schema, model, Document, Types } from 'mongoose';

export interface IFormResponse extends Document {
  eventId: Types.ObjectId;
  guestId: Types.ObjectId;
  answers: Map<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const formResponseSchema = new Schema<IFormResponse>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    guestId: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
    answers: { type: Map, of: Schema.Types.Mixed },
  },
  { timestamps: true }
);

formResponseSchema.index({ eventId: 1 });
formResponseSchema.index({ guestId: 1 }, { unique: true });

export const FormResponse = model<IFormResponse>('FormResponse', formResponseSchema);
