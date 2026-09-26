"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, PasswordInput } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createOrganization } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewOrganizationPage() {
  const router = useRouter();
  const { notify } = useToast();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    owner_full_name: "",
    owner_email: "",
    owner_password: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const org = await createOrganization(form);
      notify(`${org.name} created`);
      router.push(`/admin/organizations/${org.id}`);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to create organization", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Link href="/admin" className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Organizations
      </Link>
      <h1 className="mb-4 text-[15px] font-semibold text-foreground">New organization</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Business name</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" required value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
          </div>
          <hr className="border-border" />
          <p className="text-sm font-medium text-foreground">Owner account</p>
          <div>
            <Label htmlFor="owner-name">Full name</Label>
            <Input id="owner-name" required value={form.owner_full_name} onChange={(e) => setForm({ ...form, owner_full_name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="owner-email">Email</Label>
            <Input id="owner-email" type="email" required value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="owner-password">Temporary password</Label>
            <PasswordInput
              id="owner-password"
              required
              minLength={8}
              value={form.owner_password}
              onChange={(e) => setForm({ ...form, owner_password: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" loading={saving}>
            Create organization
          </Button>
        </form>
      </Card>
    </div>
  );
}
