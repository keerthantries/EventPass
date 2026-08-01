"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Download, AlertTriangle, Save } from "lucide-react";
import { useFormSchema, usePutForm, useFormResponses, useEvent } from "@/hooks/queries";
import { ApiClientError, downloadFile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { FormField } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton, PageError } from "@/components/ui/page-state";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/ui/datatable";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldEditor } from "@/components/forms/field-editor";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";

export default function FormsPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const { user } = useAuth();
  const canManage = user?.role === "organizer" || user?.role === "super_admin";

  const { data, isLoading, isError, error, refetch } = useFormSchema(eventId);
  const { data: event } = useEvent(eventId);

  const dynamicFormEnabled = event?.config?.modules.dynamicForm ?? true;

  if (isLoading) return <PageSkeleton />;
  if (isError) return <PageError message={(error as Error)?.message} onRetry={() => refetch()} />;
  if (!data) return <PageSkeleton />;

  return (
    <div>
      <PageHeader title="Forms" description="Build the dynamic form guests fill after accepting an invitation." />

      {!dynamicFormEnabled ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>The Dynamic Form module is currently disabled for this event. Enable it in Settings for forms to be shown to guests.</span>
        </div>
      ) : null}

      <Tabs defaultValue="builder">
        <TabsList>
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <FormBuilder key={eventId} eventId={eventId} initialFields={data.fields} canManage={canManage} />
        </TabsContent>

        <TabsContent value="responses">
          <ResponsesTab eventId={eventId} canManage={canManage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FormBuilder({
  eventId,
  initialFields,
  canManage,
}: {
  eventId: string;
  initialFields: FormField[];
  canManage: boolean;
}) {
  const { toast } = useToast();
  const putMutation = usePutForm(eventId);
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [savedFields, setSavedFields] = useState<FormField[]>(initialFields);
  const [saving, setSaving] = useState(false);
  const dirty = fields !== savedFields;

  const save = async () => {
    setSaving(true);
    try {
      await putMutation.mutateAsync(fields);
      setSavedFields(fields);
      toast({ title: "Form saved", variant: "success" });
    } catch (err) {
      toast({
        title: "Could not save form",
        description: err instanceof ApiClientError ? err.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <FieldEditor fields={fields} onChange={setFields} saving={saving} />
        {dirty && fields.length > 0 ? <p className="mt-2 text-xs text-fg-muted">Unsaved changes — use “Save form” to persist.</p> : null}
        {canManage ? (
          <div className="mt-4 flex justify-end">
            <Button onClick={save} loading={saving || putMutation.isPending} disabled={!dirty}>
              <Save className="size-4" />
              Save form
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ResponsesTab({ eventId, canManage }: { eventId: string; canManage: boolean }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useFormResponses(eventId, { page: String(page), limit: "20" });
  const { toast } = useToast();

  const first = data?.items?.[0];
  const columns = first
    ? [
        { key: "guestName", label: "Guest" },
        ...Object.keys(first.answers).map((k) => ({ key: k, label: k })),
        { key: "_submittedAt", label: "Submitted" },
      ]
    : [];

  const tableColumns: DataTableColumn<import("@/lib/types").FormResponseRow>[] = columns.map((c) => ({
    key: c.key,
    header: c.label,
    primary: c.key === "guestName",
    cell: (r) => {
      if (c.key === "guestName") return <span className="font-medium text-fg">{r.guestName}</span>;
      if (c.key === "_submittedAt") return <span className="text-fg-secondary">{formatDateTime(r.submittedAt)}</span>;
      const v = r.answers[c.key];
      if (Array.isArray(v)) return v.join(", ");
      if (v === undefined || v === null || v === "") return <span className="text-fg-muted">—</span>;
      return String(v);
    },
  }));

  if (isLoading) return <PageSkeleton rows={4} />;
  if (isError) return <PageError message={(error as Error)?.message} onRetry={() => refetch()} />;

  const handleExport = () => {
    downloadFile(`/events/${eventId}/form/responses/export?format=csv`, "form-responses.csv").catch((e) =>
      toast({ title: "Export failed", description: (e as Error).message, variant: "error" })
    );
  };

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="size-4" />
            Export
          </Button>
        </div>
      ) : null}
      {data?.items.length === 0 ? (
        <Card>
          <EmptyState
            title="No responses yet"
            description="Guest form responses will appear here once guests submit the form."
          />
        </Card>
      ) : (
        <DataTable
          columns={tableColumns}
          data={data?.items ?? []}
          getRowId={(r) => r.guestId}
          meta={data?.meta}
          onPageChange={setPage}
          titleAccessor={(r) => r.guestName}
          subtitleAccessor={(r) => `Submitted ${formatDateTime(r.submittedAt)}`}
        />
      )}
    </div>
  );
}
