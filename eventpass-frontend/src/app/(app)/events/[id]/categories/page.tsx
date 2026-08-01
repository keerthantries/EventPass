"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton, PageError } from "@/components/ui/page-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { CategoryDot } from "@/components/guests/guest-badges";
import { ApiClientError } from "@/lib/api";

const PRESET_COLORS = ["#6b78e6", "#2fb85e", "#e0a83c", "#e5484d", "#22d3ee", "#a855f7", "#64748b", "#f472b6"];

interface CategoryFormProps {
  eventId: string;
  existing?: { id: string; name: string; colorTag?: string };
  onDone: () => void;
}

function CategoryForm({ eventId, existing, onDone }: CategoryFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState(existing?.name ?? "");
  const [color, setColor] = useState(existing?.colorTag ?? PRESET_COLORS[0]);
  const createMutation = useCreateCategory(eventId);
  const updateMutation = useUpdateCategory(eventId);

  const submit = async () => {
    if (!name.trim()) return;
    try {
      if (existing) {
        await updateMutation.mutateAsync({ id: existing.id, payload: { name: name.trim(), colorTag: color } });
        toast({ title: "Category updated", variant: "success" });
      } else {
        await createMutation.mutateAsync({ name: name.trim(), colorTag: color });
        toast({ title: "Category created", variant: "success" });
      }
      onDone();
    } catch (err) {
      toast({ title: "Could not save category", description: err instanceof ApiClientError ? err.message : "Try again", variant: "error" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="catName">Name</Label>
        <Input id="catName" value={name} onChange={(e) => setName(e.target.value)} placeholder="VIP" />
      </div>
      <div className="space-y-1.5">
        <Label>Color tag</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              className={`size-6 rounded-full border-2 transition-transform ${color === c ? "scale-110 border-fg" : "border-transparent"}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!name.trim()} loading={createMutation.isPending || updateMutation.isPending}>
          {existing ? "Save" : "Create"}
        </Button>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch } = useCategories(eventId);
  const deleteMutation = useDeleteCategory(eventId);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; colorTag?: string } | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? Guests assigned to it will not be deleted.`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Category deleted", variant: "success" });
    } catch (err) {
      toast({
        title: "Could not delete category",
        description: err instanceof ApiClientError ? err.message : "It may still have guests assigned.",
        variant: "error",
      });
    }
  };

  if (isLoading) return <PageSkeleton />;
  if (isError) return <PageError message={(error as Error)?.message} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Group guests for invitations, reporting and filtering."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            New category
          </Button>
        }
      />

      {!data || data.length === 0 ? (
        <Card>
          <EmptyState title="No categories yet" description="Create categories like VIP, Staff or Table 1 to organize your guests." />
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {data.map((c) => (
                <li key={c._id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <CategoryDot color={c.colorTag} name={c.name} />
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing({ id: c._id, name: c.name, colorTag: c.colorTag });
                        setOpen(true);
                      }}
                      aria-label={`Edit ${c.name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c._id, c.name)} aria-label={`Delete ${c.name}`}>
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{editing ? "Edit category" : "New category"}</ModalTitle>
            <ModalDescription>Categories help you filter and report on guests.</ModalDescription>
          </ModalHeader>
          <ModalBody>
            <CategoryForm
              eventId={eventId}
              existing={editing ?? undefined}
              onDone={() => {
                setOpen(false);
                setEditing(null);
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
