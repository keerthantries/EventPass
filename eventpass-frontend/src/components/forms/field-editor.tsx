"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GripVertical, Plus, Trash2, ChevronUp, ChevronDown, Pencil, X, Check } from "lucide-react";
import type { FormField, FormFieldType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  short_text: "Short text",
  long_text: "Long text",
  number: "Number",
  email: "Email",
  phone: "Phone",
  date: "Date",
  time: "Time",
  dropdown: "Dropdown",
  radio: "Radio",
  checkbox: "Checkbox",
  multi_choice: "Multi choice",
  yes_no: "Yes / No",
};

export const CHOICE_TYPES: FormFieldType[] = ["dropdown", "radio", "checkbox", "multi_choice"];
export const FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as FormFieldType[];

const fieldSchema = z
  .object({
    key: z.string().min(1, "Key is required"),
    label: z.string().min(1, "Label is required"),
    type: z.enum([
      "short_text",
      "long_text",
      "number",
      "email",
      "phone",
      "date",
      "time",
      "dropdown",
      "radio",
      "checkbox",
      "multi_choice",
      "yes_no",
    ]),
    required: z.boolean(),
    placeholder: z.string().optional(),
    description: z.string().optional(),
    options: z.array(z.string()).optional(),
  })
  .refine(
    (f) => !CHOICE_TYPES.includes(f.type) || (f.options?.length ?? 0) > 0,
    { message: "Add at least one option", path: ["options"] }
  );

type FieldValues = z.infer<typeof fieldSchema>;

interface FieldEditorProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
  saving?: boolean;
}

export function FieldEditor({ fields, onChange, saving }: FieldEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newCount, setNewCount] = useState(0);

  const addField = (type: FormFieldType) => {
    if (fields.length >= 30) return;
    const key = `field_${type}_${newCount}`;
    const field: FormField = {
      key,
      label: FIELD_TYPE_LABELS[type],
      type,
      required: false,
      options: CHOICE_TYPES.includes(type) ? ["Option 1"] : undefined,
    };
    onChange([...fields, field]);
    setEditingIndex(fields.length);
    setNewCount((c) => c + 1);
  };

  const removeField = (index: number) => {
    const next = fields.filter((_, i) => i !== index);
    onChange(next);
    setEditingIndex(null);
  };

  const moveField = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong p-6 text-center text-sm text-fg-muted">
          No fields yet. Pick a field type below to start building your form.
        </div>
      ) : (
        fields.map((field, index) => (
          <div key={`${field.key}-${index}`} className="rounded-lg border border-border bg-surface">
            <div className="group flex items-center gap-3 p-3">
              <GripVertical className="size-4 shrink-0 cursor-grab text-fg-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">
                  {field.label}
                  {field.required ? <span className="ml-1 text-danger">*</span> : null}
                </p>
                <p className="text-xs text-fg-muted">
                  {FIELD_TYPE_LABELS[field.type]}
                  {CHOICE_TYPES.includes(field.type) ? ` · ${field.options?.length ?? 0} options` : ""}
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                <Button type="button" variant="ghost" size="icon" onClick={() => moveField(index, -1)} aria-label="Move up">
                  <ChevronUp className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => moveField(index, 1)} aria-label="Move down">
                  <ChevronDown className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => setEditingIndex(editingIndex === index ? null : index)} aria-label="Edit field">
                  <Pencil className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeField(index)} aria-label="Remove field">
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </div>
            </div>
            {editingIndex === index ? (
              <div className="border-t border-border p-3">
                <FieldEditForm
                  field={field}
                  onSave={(updated) => {
                    const next = [...fields];
                    next[index] = updated;
                    onChange(next);
                    setEditingIndex(null);
                  }}
                  onCancel={() => setEditingIndex(null)}
                />
              </div>
            ) : null}
          </div>
        ))
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex flex-wrap gap-1.5">
          {FIELD_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              variant="outline"
              size="sm"
              disabled={fields.length >= 30}
              onClick={() => addField(type)}
            >
              <Plus className="size-3.5" />
              {FIELD_TYPE_LABELS[type]}
            </Button>
          ))}
        </div>
        <Button type="button" onClick={() => onChange(fields)} disabled={fields.length === 0} loading={saving}>
          Save form
        </Button>
      </div>
    </div>
  );
}

export function FieldEditForm({
  field,
  onSave,
  onCancel,
}: {
  field: FormField;
  onSave: (f: FormField) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FieldValues>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder ?? "",
      description: field.description ?? "",
      options: field.options ?? [],
    },
  });

  const type = watch("type");
  const options = watch("options") ?? [];
  const isChoice = CHOICE_TYPES.includes(type);

  const onSubmit = (values: FieldValues) => {
    onSave({
      key: values.key,
      label: values.label,
      type: values.type,
      required: values.required,
      placeholder: values.placeholder || undefined,
      description: values.description || undefined,
      options: isChoice ? values.options?.filter((o) => o.trim()) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="fieldLabel">Label</Label>
        <Input id="fieldLabel" placeholder="What do you want to ask?" {...register("label")} />
        {errors.label ? <p className="text-xs text-danger">{errors.label.message}</p> : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fieldType">Type</Label>
          <select
            id="fieldType"
            className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-ring/40"
            {...register("type")}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {FIELD_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fieldKey">Key</Label>
          <Input id="fieldKey" {...register("key")} />
          {errors.key ? <p className="text-xs text-danger">{errors.key.message}</p> : null}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fieldPlaceholder">Placeholder</Label>
        <Input id="fieldPlaceholder" {...register("placeholder")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fieldDesc">Description</Label>
        <Textarea id="fieldDesc" rows={2} {...register("description")} placeholder="Optional helper text" />
      </div>
      {isChoice ? (
        <div className="space-y-2">
          <Label>Options</Label>
          <div className="space-y-2">
            {options.map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input {...register(`options.${i}`)} placeholder={`Option ${i + 1}`} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setValue("options", options.filter((_, oi) => oi !== i))}
                  aria-label="Remove option"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setValue("options", [...options, `Option ${options.length + 1}`])}
          >
            <Plus className="size-3.5" />
            Add option
          </Button>
          {errors.options ? <p className="text-xs text-danger">Add at least one option</p> : null}
        </div>
      ) : null}
      <label className="flex items-center gap-2 text-sm text-fg-secondary">
        <Checkbox
          checked={watch("required")}
          onCheckedChange={(c) => setValue("required", c === true)}
        />
        Required question
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Check className="size-4" />
          Save field
        </Button>
      </div>
    </form>
  );
}
