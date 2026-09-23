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

  brideName?: string;
  groomName?: string;
  dressCode?: string;
  weddingWebsiteUrl?: string;
  invitationBackgroundImage?: string;
  invitationMessage?: string;

  venueAddress?: string;
  guestArrivalTime?: string;
  bismillahImageUrl?: string;
  quranVerse?: string;
  quranReference?: string;

  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
    description: { type: String, maxlength: 2000 },
    type: { type: String, default: 'Other', trim: true, maxlength: 50 },
    venue: { type: String, maxlength: 300 },
    mapLink: String,
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    startTime: String,
    endTime: String,
    timezone: { type: String, default: 'America/New_York' },
    bannerImage: String,
    coverImage: String,
    logo: String,
    branding: {
      primaryColor: String,
      secondaryColor: String,
    },
    status: { type: String, enum: ['draft', 'published', 'completed', 'archived'], default: 'draft' },

    brideName: { type: String, trim: true, maxlength: 100 },
    groomName: { type: String, trim: true, maxlength: 100 },
    dressCode: { type: String, trim: true, maxlength: 200 },
    weddingWebsiteUrl: { type: String, trim: true, maxlength: 500 },
    invitationBackgroundImage: String,
    invitationMessage: { type: String, maxlength: 5000 },

    venueAddress: { type: String, trim: true, maxlength: 500 },
    guestArrivalTime: { type: String, trim: true, maxlength: 20 },
    bismillahImageUrl: { type: String, trim: true, maxlength: 1000 },
    quranVerse: { type: String, trim: true, maxlength: 500 },
    quranReference: { type: String, trim: true, maxlength: 100 },
  },
  { timestamps: true }
);

eventSchema.index({ organizerId: 1, status: 1 });
eventSchema.index({ organizerId: 1, createdAt: -1 });
eventSchema.index({ name: 'text' });

export const Event = model<IEvent>('Event', eventSchema);
