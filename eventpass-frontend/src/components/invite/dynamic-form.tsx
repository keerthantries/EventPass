"use client";

import { useState } from "react";
import type { FormField } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (answers: Record<string, unknown>) => Promise<void>;
  submitting?: boolean;
}

export function DynamicForm({ fields, onSubmit, submitting }: DynamicFormProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, value: unknown) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    for (const f of fields) {
      const v = answers[f.key];
      if (f.required && (v === undefined || v === "" || (Array.isArray(v) && v.length === 0))) {
        errs[f.key] = "This question is required";
      }
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    await onSubmit(answers);
  };

  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <Label>
              {field.label}
              {field.required ? <span className="ml-0.5 text-danger">*</span> : null}
            </Label>
            {field.description ? <span className="text-xs text-fg-muted">{field.description}</span> : null}
          </div>
          <FieldInput field={field} value={answers[field.key]} onChange={(v) => set(field.key, v)} />
          {errors[field.key] ? <p className="text-xs text-danger">{errors[field.key]}</p> : null}
        </div>
      ))}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className={cn(
          "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-medium text-white transition-opacity",
          "hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
        )}
        style={{ background: "var(--brand-primary, #6b78e6)" }}
      >
        {submitting ? "Submitting…" : "Submit"}
      </button>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const inputClass =
    "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2";

  switch (field.type) {
    case "long_text":
      return (
        <Textarea
          rows={3}
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      );
    case "email":
      return <Input type="email" placeholder={field.placeholder} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "phone":
      return <Input type="tel" placeholder={field.placeholder} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "date":
      return <Input type="date" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "time":
      return <Input type="time" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "dropdown":
      return (
        <select className={cn(inputClass, "border-border")} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="" disabled>
            {field.placeholder ?? "Select…"}
          </option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "radio":
      return (
        <RadioGroup value={(value as string) ?? ""} onValueChange={onChange}>
          {field.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm text-fg-secondary">
              <RadioGroupItem value={o} />
              {o}
            </label>
          ))}
        </RadioGroup>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm text-fg-secondary">
          <Checkbox checked={value === true} onCheckedChange={(v) => onChange(v === true)} />
          {field.placeholder ?? field.label}
        </label>
      );
    case "multi_choice": {
      const selected: string[] = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2">
          {field.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm text-fg-secondary">
              <Checkbox
                checked={selected.includes(o)}
                onCheckedChange={(checked) => {
                  const next = checked ? [...selected, o] : selected.filter((x) => x !== o);
                  onChange(next);
                }}
              />
              {o}
            </label>
          ))}
        </div>
      );
    }
    case "yes_no":
      return (
        <RadioGroup value={(value as string) ?? ""} onValueChange={onChange} className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-fg-secondary">
            <RadioGroupItem value="Yes" />
            Yes
          </label>
          <label className="flex items-center gap-2 text-sm text-fg-secondary">
            <RadioGroupItem value="No" />
            No
          </label>
        </RadioGroup>
      );
    default:
      return (
        <Input
          type="text"
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
