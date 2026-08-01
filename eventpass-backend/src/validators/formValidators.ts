import { z } from 'zod';

const formFieldSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: z.enum([
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
    ]),
    required: z.boolean().optional().default(false),
    placeholder: z.string().optional(),
    defaultValue: z.unknown().optional(),
    description: z.string().optional(),
    options: z.array(z.string()).optional(),
  })
  .refine((f) => !['dropdown', 'radio', 'checkbox', 'multi_choice'].includes(f.type) || (f.options && f.options.length > 0), {
    message: 'options are required for dropdown/radio/checkbox/multi_choice fields',
    path: ['options'],
  });

export const putFormSchema = z
  .object({ fields: z.array(formFieldSchema).max(30) })
  .refine((data) => new Set(data.fields.map((f) => f.key)).size === data.fields.length, {
    message: 'field keys must be unique',
    path: ['fields'],
  });

export const submitRsvpSchema = z.object({
  response: z.enum(['accepted', 'declined', 'maybe']),
});

export const submitFormResponseSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
});
