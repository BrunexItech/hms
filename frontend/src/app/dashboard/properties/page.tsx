"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, MapPin, DoorOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { createProperty, listProperties } from "@/lib/endpoints";
import { Property } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { resolveImageUrl } from "@/lib/config";
import { FadeIn, StaggerList, StaggerItem } from "@/components/ui/motion";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { BuildingGlyph } from "@/components/marketing/skyline";
import { useBrand } from "@/lib/brand-context";

export default function PropertiesPage() {
  const { notify } = useToast();
  const brand = useBrand();
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
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
      await createProperty({ name, address: address || undefined, photo_url: photoUrl || undefined });
      notify("Property created");
      setOpen(false);
      setName("");
      setAddress("");
      setPhotoUrl(null);
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
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-foreground">Properties</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> New property
        </Button>
      </div>

      {properties.length === 0 ? (
        <FadeIn>
          <Card className="flex flex-col items-center py-16 text-center">
            <Building2 className="mb-3 h-8 w-8 text-muted" />
            <p className="text-sm font-medium text-foreground">No properties yet</p>
            <p className="mt-1 text-[13px] text-muted">Add your first branch or plot to start registering units.</p>
          </Card>
        </FadeIn>
      ) : (
        <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <StaggerItem key={p.id}>
              <Link href={`/dashboard/properties/${p.id}`} className="group block h-full">
                <div className="premium-card premium-card-interactive h-full overflow-hidden p-0 transition-transform duration-200 group-hover:-translate-y-1">
                  <div className="relative h-40 w-full overflow-hidden">
                    {p.photo_url ? (
                      <ProgressiveImage
                        src={resolveImageUrl(p.photo_url) ?? ""}
                        alt={p.name}
                        className="h-full w-full"
                        imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{
                          background: brand
                            ? `linear-gradient(135deg, color-mix(in srgb, ${brand.color} 85%, transparent), color-mix(in srgb, ${brand.color} 45%, black))`
                            : "linear-gradient(135deg, var(--primary), var(--primary-2))",
                        }}
                      >
                        <BuildingGlyph className="h-20 w-20 text-white opacity-70" />
                      </div>
                    )}
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                      <DoorOpen className="h-3 w-3" /> {p.unit_count} unit{p.unit_count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="truncate text-[14px] font-semibold text-foreground">{p.name}</p>
                    {p.address ? (
                      <p className="mt-1 flex items-center gap-1 truncate text-[12.5px] text-muted">
                        <MapPin className="h-3 w-3 shrink-0" /> {p.address}
                      </p>
                    ) : (
                      <p className="mt-1 text-[12.5px] text-muted">No address set</p>
                    )}
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
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
          <div>
            <Label>Photo (optional)</Label>
            <ImageUpload value={photoUrl} onChange={setPhotoUrl} label="photo" />
          </div>
          <Button type="submit" className="w-full" loading={saving}>
            Create property
          </Button>
        </form>
      </Modal>
    </div>
  );
}
