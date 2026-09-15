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

const BANNER_TONES = ["premium-gradient", "gradient-info", "gradient-success", "gradient-warning"];

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
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Properties</h1>
          <p className="text-sm text-muted">Branches, plots and buildings under your business.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New property
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <Building2 className="mb-3 h-10 w-10 text-muted" />
          <p className="font-medium text-foreground">No properties yet</p>
          <p className="mt-1 text-sm text-muted">Add your first branch or plot to start registering units.</p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p, i) => (
            <Link key={p.id} href={`/dashboard/properties/${p.id}`}>
              <Card interactive className="h-full overflow-hidden p-0">
                <div className={`relative flex h-24 items-center justify-center ${BANNER_TONES[i % BANNER_TONES.length]}`}>
                  <div className="dot-grid absolute inset-0 opacity-20" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <ChevronRight className="absolute right-3 top-3 h-4 w-4 text-white/80" />
                </div>
                <div className="p-5">
                  <p className="font-display font-semibold text-foreground">{p.name}</p>
                  {p.address && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                      <MapPin className="h-3.5 w-3.5" /> {p.address}
                    </p>
                  )}
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted">
                    <DoorOpen className="h-3.5 w-3.5" /> {p.unit_count} unit{p.unit_count === 1 ? "" : "s"}
                  </p>
                </div>
              </Card>
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
