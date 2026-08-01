import { Schema, model, Document, Types } from 'mongoose';

export type EventStatus = 'draft' | 'published' | 'completed' | 'archived';

export interface IEvent extends Document {
  organizerId: Types.ObjectId;
  name: string;
  description?: string;
  type: string;
  venue?: string;
  mapLink?: string;
  startDate: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  timezone: string;
  bannerImage?: string;
  coverImage?: string;
  logo?: string;
  branding: { primaryColor?: string; secondaryColor?: string };
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
    description: { type: String, maxlength: 2000 },
    type: { type: String, required: true, trim: true, maxlength: 50 }, // free text — never enum-restricted (PRD §3)
    venue: { type: String, maxlength: 300 },
    mapLink: String,
    startDate: { type: Date, required: true },
    endDate: Date,
    startTime: String, // "HH:mm"
    endTime: String,
    timezone: { type: String, default: 'Asia/Kolkata' },
    bannerImage: String,
    coverImage: String,
    logo: String,
    branding: {
      primaryColor: String,
      secondaryColor: String,
    },
    status: { type: String, enum: ['draft', 'published', 'completed', 'archived'], default: 'draft' },
  },
  { timestamps: true }
);

eventSchema.index({ organizerId: 1, status: 1 });
eventSchema.index({ name: 'text' });

export const Event = model<IEvent>('Event', eventSchema);
