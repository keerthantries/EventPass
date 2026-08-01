import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: Types.ObjectId;
  action: string;
  entity: string;
  entityId: Types.ObjectId;
  meta?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g. 'event.create', 'guest.delete'
    entity: { type: String, required: true }, // e.g. 'Event' | 'Guest'
    entityId: { type: Schema.Types.ObjectId, required: true },
    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);

/** Fire-and-forget audit helper used by controllers; never blocks/throws into the main request flow. */
export async function writeAuditLog(actorId: Types.ObjectId | string, action: string, entity: string, entityId: Types.ObjectId | string, meta?: unknown) {
  try {
    await AuditLog.create({ actorId, action, entity, entityId, meta });
  } catch {
    // audit logging must never break the primary request
  }
}
