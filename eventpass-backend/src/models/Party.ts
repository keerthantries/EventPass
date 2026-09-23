import { Schema, model, Document, Types } from 'mongoose';

export interface IParty extends Document {
  eventId: Types.ObjectId;
  name: string;
  side?: string;
  contactEmail?: string;
  contactPhone?: string;
  token: string;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const partySchema = new Schema<IParty>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    side: { type: String, trim: true, maxlength: 50 },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true, maxlength: 20 },
    token: { type: String, required: true },
    externalId: { type: String, trim: true },
  },
  { timestamps: true }
);

partySchema.index({ eventId: 1 });
partySchema.index({ eventId: 1, token: 1 }, { unique: true });
partySchema.index({ eventId: 1, externalId: 1 }, { unique: true, sparse: true });

export const Party = model<IParty>('Party', partySchema);
