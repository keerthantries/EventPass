import { Schema, model, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  eventId: Types.ObjectId;
  name: string;
  colorTag?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true, trim: true, maxlength: 50 }, // organizer-defined, never hardcoded (PRD §9)
    colorTag: String,
  },
  { timestamps: true }
);

categorySchema.index({ eventId: 1, name: 1 }, { unique: true });

export const Category = model<ICategory>('Category', categorySchema);
