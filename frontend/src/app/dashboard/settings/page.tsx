"use client";

import { FormEvent, useEffect, useState } from "react";
import { Palette, Check } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { getMyOrganization, updateMyOrganization } from "@/lib/endpoints";
import { Organization } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { resolveImageUrl } from "@/lib/config";
import { ChangePasswordCard } from "@/components/change-password-card";
import { FadeIn } from "@/components/ui/motion";
import { useBrand } from "@/lib/brand-context";

const PRESET_COLORS = ["#7C3AED", "#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

export default function SettingsPage() {
  const { notify } = useToast();
  const brand = useBrand();
  const [org, setOrg] = useState<Organization | null>(null);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [color, setColor] = useState("#7C3AED");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getMyOrganization().then((o) => {
      setOrg(o);
      setName(o.name);
      setLogoUrl(o.logo_url);
      setColor(o.primary_color);
    });
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyOrganization({ name, logo_url: logoUrl ?? "", primary_color: color });
      notify("Branding updated");
      await brand?.refresh?.();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!org) return <FullPageSpinner />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-[15px] font-semibold text-foreground">Settings</h1>
      <p className="mb-4 text-[13px] text-muted">Customize your business identity across the platform.</p>

      <FadeIn>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" /> Branding
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <Label htmlFor="org-name">Business name</Label>
            <Input id="org-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Logo</Label>
            <ImageUpload value={logoUrl} onChange={setLogoUrl} label="logo" shape="circle" />
          </div>
          <div>
            <Label>Brand color</Label>
            <div className="flex flex-wrap items-center gap-2.5">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-9 w-9 rounded-full border-2 transition-transform hover:scale-105 cursor-pointer"
                  style={{ background: c, borderColor: color === c ? "var(--foreground)" : "transparent" }}
                  aria-label={c}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-9 cursor-pointer rounded-full border border-border bg-transparent p-0"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Preview</p>
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl text-white shadow"
                style={{ background: color, boxShadow: `0 0 0 2px ${color}` }}
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveImageUrl(logoUrl) ?? undefined} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase() || "?"
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{name || "Your business"}</p>
                <p className="text-xs text-muted">This is how residents will see your brand</p>
              </div>
            </div>
          </div>

          <Button type="submit" loading={saving}>
            {saved ? (
              <>
                <Check className="h-4 w-4" /> Saved
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </form>
      </Card>
      </FadeIn>

      <div className="mt-5">
        <ChangePasswordCard />
      </div>
    </div>
  );
}
