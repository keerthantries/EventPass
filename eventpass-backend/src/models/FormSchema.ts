import { Schema, model, Document, Types } from 'mongoose';

export type FormFieldType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'time'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'multi_choice'
  | 'yes_no';

export interface IFormField {
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  description?: string;
  options?: string[];
}

export interface IFormSchema extends Document {
  eventId: Types.ObjectId;
  fields: IFormField[];
  createdAt: Date;
  updatedAt: Date;
}

const formFieldSchema = new Schema<IFormField>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'short_text',
        'long_text',
        'number',
        'email',
        'phone',
        'date',
        'time',
        'dropdown',
        'radio',
        'checkbox',
        'multi_choice',
        'yes_no',
      ],
      required: true,
    },
    required: { type: Boolean, default: false },
    placeholder: String,
    defaultValue: Schema.Types.Mixed,
    description: String,
    options: [String],
  },
  { _id: false }
);

const formSchemaSchema = new Schema<IFormSchema>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    fields: [formFieldSchema],
  },
  { timestamps: true }
);

formSchemaSchema.index({ eventId: 1 }, { unique: true });

export const FormSchema = model<IFormSchema>('FormSchema', formSchemaSchema);
