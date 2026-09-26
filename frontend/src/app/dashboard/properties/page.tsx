"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, ChevronRight, MapPin, DoorOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { createProperty, listProperties } from "@/lib/endpoints";
import { Property } from "@/lib/types";
import { ApiError } from "@/lib/api";

export default function PropertiesPage() {
  const { notify } = useToast();
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setProperties(await listProperties());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createProperty({ name, address: address || undefined });
      notify("Property created");
      setOpen(false);
      setName("");
      setAddress("");
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to create property", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!properties) return <FullPageSpinner />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-[15px] font-semibold text-foreground">Properties</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> New property
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <Building2 className="mb-3 h-8 w-8 text-muted" />
          <p className="text-sm font-medium text-foreground">No properties yet</p>
          <p className="mt-1 text-[13px] text-muted">Add your first branch or plot to start registering units.</p>
        </Card>
      ) : (
        <div className="premium-card divide-y divide-border overflow-hidden p-0">
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/properties/${p.id}`}
              className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface-2"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-foreground">{p.name}</p>
                {p.address && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[12.5px] text-muted">
                    <MapPin className="h-3 w-3 shrink-0" /> {p.address}
                  </p>
                )}
              </div>
              <p className="hidden shrink-0 items-center gap-1.5 text-[12.5px] text-muted sm:flex">
                <DoorOpen className="h-3.5 w-3.5" /> {p.unit_count} unit{p.unit_count === 1 ? "" : "s"}
              </p>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New property">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="p-name">Name</Label>
            <Input id="p-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Greenview Block A" />
          </div>
          <div>
            <Label htmlFor="p-address">Address (optional)</Label>
            <Input id="p-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Nairobi, Kenya" />
          </div>
          <Button type="submit" className="w-full" loading={saving}>
            Create property
          </Button>
        </form>
      </Modal>
    </div>
  );
}
