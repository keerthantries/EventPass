"use client";

import * as React from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  accept?: string;
  label?: string;
  hint?: string;
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function FileUpload({ accept, label = "Choose file", hint, onFile, disabled }: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const handleFiles = React.useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (!f) return;
      setFile(f);
      onFile(f);
    },
    [onFile]
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-surface p-6 text-center transition-colors",
        dragging && "border-primary bg-primary/5",
        disabled && "pointer-events-none opacity-50"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {file ? (
        <div className="flex w-full items-center justify-center gap-2 text-sm text-fg">
          <FileText className="size-4 text-primary" />
          <span className="truncate">{file.name}</span>
          <button
            type="button"
            onClick={() => {
              setFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="rounded p-0.5 text-fg-muted hover:text-fg"
            aria-label="Remove file"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <UploadCloud className="size-5 text-fg-muted" />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            {label}
          </Button>
          {hint ? <p className="text-xs text-fg-muted">{hint}</p> : null}
        </div>
      )}
    </div>
  );
}
