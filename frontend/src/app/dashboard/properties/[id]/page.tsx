"use client";

import { use, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, DoorOpen, Pencil, Plus, QrCode as QrIcon, RefreshCw, Copy, UserPlus, Printer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { Badge } from "@/components/ui/badge";
import { QrCode } from "@/components/ui/qr-code";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  createTenancy,
  createUnit,
  getProperty,
  getUnitAccessLink,
  listUnits,
  regenerateUnitAccessLink,
  updateProperty,
} from "@/lib/endpoints";
import { Property, Unit } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { resolveImageUrl } from "@/lib/config";
import { FadeIn, StaggerList, StaggerItem } from "@/components/ui/motion";

export default function PropertyUnitsPage({ params }: PageProps<"/dashboard/properties/[id]">) {
  const { id: propertyId } = use(params);
  const { notify } = useToast();

  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [accessUnit, setAccessUnit] = useState<Unit | null>(null);
  const [accessUrl, setAccessUrl] = useState<string | null>(null);

  const [tenantUnit, setTenantUnit] = useState<Unit | null>(null);
  const [tenantForm, setTenantForm] = useState({ full_name: "", email: "", phone: "", start_date: "" });
  const [tenantSaving, setTenantSaving] = useState(false);

  async function refresh() {
    const prop = await getProperty(propertyId);
    setProperty(prop);
    setEditName(prop.name);
    setEditAddress(prop.address ?? "");
    setEditPhotoUrl(prop.photo_url);
    setUnits(await listUnits(propertyId));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  async function handleEditProperty(e: FormEvent) {
    e.preventDefault();
    setEditSaving(true);
    try {
      await updateProperty(propertyId, { name: editName, address: editAddress || undefined, photo_url: editPhotoUrl });
      notify("Property updated");
      setEditOpen(false);
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to update property", "error");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleCreateUnit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createUnit(propertyId, unitName);
      notify("Unit created");
      setCreateOpen(false);
      setUnitName("");
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to create unit", "error");
    } finally {
      setSaving(false);
    }
  }

  async function openAccess(unit: Unit) {
    setAccessUnit(unit);
    const link = await getUnitAccessLink(unit.id);
    setAccessUrl(link.access_url);
  }

  async function handleRegenerate() {
    if (!accessUnit) return;
    const link = await regenerateUnitAccessLink(accessUnit.id);
    setAccessUrl(link.access_url);
    notify("Access link regenerated — the old QR code no longer works");
  }

  async function handleCopy() {
    if (!accessUrl) return;
    await navigator.clipboard.writeText(accessUrl);
    notify("Link copied to clipboard");
  }

  async function handleRegisterTenant(e: FormEvent) {
    e.preventDefault();
    if (!tenantUnit) return;
    setTenantSaving(true);
    try {
      await createTenancy({ unit_id: tenantUnit.id, ...tenantForm, phone: tenantForm.phone || undefined });
      notify("Tenant registered — they can now sign in via the unit's access link");
      setTenantUnit(null);
      setTenantForm({ full_name: "", email: "", phone: "", start_date: "" });
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to register tenant", "error");
    } finally {
      setTenantSaving(false);
    }
  }

  if (!units || !property) return <FullPageSpinner />;

  return (
    <div>
      <Link href="/dashboard/properties" className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Properties
      </Link>

      <FadeIn>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
            {property.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveImageUrl(property.photo_url) ?? undefined} alt={property.name} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold text-foreground">{property.name}</h1>
            {property.address && <p className="truncate text-[12px] text-muted">{property.address}</p>}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New unit
          </Button>
        </div>
      </div>
      </FadeIn>

      {units.length === 0 ? (
        <FadeIn>
          <Card className="flex flex-col items-center py-16 text-center">
            <DoorOpen className="mb-3 h-8 w-8 text-muted" />
            <p className="text-sm font-medium text-foreground">No units yet</p>
            <p className="mt-1 text-[13px] text-muted">Add a unit to generate its resident access link.</p>
          </Card>
        </FadeIn>
      ) : (
        <StaggerList className="premium-card divide-y divide-border overflow-hidden p-0">
          {units.map((u) => (
            <StaggerItem key={u.id}>
              <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${u.status === "occupied" ? "bg-success" : "bg-border"}`}
                  aria-hidden
                />
                <p className="min-w-0 flex-1 text-[13.5px] font-medium text-foreground">{u.name}</p>
                <Badge tone={u.status === "occupied" ? "success" : "neutral"}>{u.status}</Badge>
                <div className="flex gap-1.5">
                  <Button variant="secondary" size="sm" onClick={() => openAccess(u)}>
                    <QrIcon className="h-3.5 w-3.5" /> Access
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setTenantUnit(u)}>
                    <UserPlus className="h-3.5 w-3.5" /> Tenant
                  </Button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerList>
      )}

      {/* Edit property modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit property">
        <form onSubmit={handleEditProperty} className="space-y-4">
          <div>
            <Label htmlFor="e-name">Name</Label>
            <Input id="e-name" required value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="e-address">Address (optional)</Label>
            <Input id="e-address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
          </div>
          <div>
            <Label>Photo</Label>
            <ImageUpload value={editPhotoUrl} onChange={setEditPhotoUrl} label="photo" />
          </div>
          <Button type="submit" className="w-full" loading={editSaving}>
            Save changes
          </Button>
        </form>
      </Modal>

      {/* Create unit modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New unit">
        <form onSubmit={handleCreateUnit} className="space-y-4">
          <div>
            <Label htmlFor="u-name">Unit name / number</Label>
            <Input id="u-name" required value={unitName} onChange={(e) => setUnitName(e.target.value)} placeholder="e.g. A1" />
          </div>
          <Button type="submit" className="w-full" loading={saving}>
            Create unit
          </Button>
        </form>
      </Modal>

      {/* Access link modal */}
      <Modal open={!!accessUnit} onClose={() => setAccessUnit(null)} title={`Access — Unit ${accessUnit?.name ?? ""}`}>
        <div className="flex flex-col items-center gap-4">
          <p className="text-center text-sm text-muted">
            Share this QR code or link with the registered resident. It only grants entry to their sign-in page —
            they still need their registered email to actually log in.
          </p>
          {accessUrl ? (
            <>
              <QrCode value={accessUrl} />
              <div className="w-full rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted break-all">{accessUrl}</div>
              <div className="flex w-full gap-2">
                <Button variant="secondary" className="flex-1" onClick={handleCopy}>
                  <Copy className="h-4 w-4" /> Copy link
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleRegenerate}>
                  <RefreshCw className="h-4 w-4" /> Regenerate
                </Button>
              </div>
              <a
                href={`/print/units/${accessUnit?.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button variant="ghost" className="w-full">
                  <Printer className="h-4 w-4" /> Print for door / gate
                </Button>
              </a>
            </>
          ) : (
            <div className="h-[180px] w-[180px] animate-pulse rounded-xl bg-surface-2" />
          )}
        </div>
      </Modal>

      {/* Register tenant modal */}
      <Modal open={!!tenantUnit} onClose={() => setTenantUnit(null)} title={`Register tenant — Unit ${tenantUnit?.name ?? ""}`}>
        <form onSubmit={handleRegisterTenant} className="space-y-4">
          <div>
            <Label htmlFor="t-name">Full name</Label>
            <Input
              id="t-name"
              required
              value={tenantForm.full_name}
              onChange={(e) => setTenantForm({ ...tenantForm, full_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="t-email">Email</Label>
            <Input
              id="t-email"
              type="email"
              required
              value={tenantForm.email}
              onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
            />
            <p className="mt-1 text-xs text-muted">Only this email will be able to sign in to this unit.</p>
          </div>
          <div>
            <Label htmlFor="t-phone">Phone (optional)</Label>
            <Input id="t-phone" value={tenantForm.phone} onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="t-start">Move-in date</Label>
            <Input
              id="t-start"
              type="date"
              required
              value={tenantForm.start_date}
              onChange={(e) => setTenantForm({ ...tenantForm, start_date: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" loading={tenantSaving}>
            Register tenant
          </Button>
        </form>
      </Modal>
    </div>
  );
}
