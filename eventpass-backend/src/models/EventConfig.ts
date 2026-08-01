import { Schema, model, Document, Types } from 'mongoose';

export type RsvpMode = 'disabled' | 'accept_only' | 'accept_decline' | 'accept_decline_maybe';
export type WorkflowKey = 'add_qr_checkin' | 'invite_rsvp' | 'invite_rsvp_form_qr' | 'invite_form_approval_qr';
export type QrTiming = 'on_add' | 'on_rsvp_accept' | 'on_approval';

export interface IEventConfig extends Document {
  eventId: Types.ObjectId;
  modules: {
    invitation: boolean;
    rsvp: boolean;
    dynamicForm: boolean;
    qrCheckin: boolean;
    csvImport: boolean;
    reports: boolean;
  };
  rsvpMode: RsvpMode;
  rsvpDeadline?: Date;
  rsvpMessages: { confirmation?: string; thankYou?: string };
  workflow: WorkflowKey;
  qrGenerationTiming: QrTiming;
  requiresApproval: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const eventConfigSchema = new Schema<IEventConfig>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    modules: {
      invitation: { type: Boolean, default: true },
      rsvp: { type: Boolean, default: false },
      dynamicForm: { type: Boolean, default: false },
      qrCheckin: { type: Boolean, default: true },
      csvImport: { type: Boolean, default: true },
      reports: { type: Boolean, default: true },
    },
    rsvpMode: {
      type: String,
      enum: ['disabled', 'accept_only', 'accept_decline', 'accept_decline_maybe'],
      default: 'disabled',
    },
    rsvpDeadline: Date,
    rsvpMessages: { confirmation: String, thankYou: String },
    workflow: {
      type: String,
      enum: ['add_qr_checkin', 'invite_rsvp', 'invite_rsvp_form_qr', 'invite_form_approval_qr'],
      required: true,
      default: 'add_qr_checkin',
    },
    qrGenerationTiming: { type: String, enum: ['on_add', 'on_rsvp_accept', 'on_approval'], default: 'on_add' },
    requiresApproval: { type: Boolean, default: false },
  },
  { timestamps: true }
);

eventConfigSchema.index({ eventId: 1 }, { unique: true });

export const EventConfig = model<IEventConfig>('EventConfig', eventConfigSchema);
