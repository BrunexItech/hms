"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon, Menu, LogOut, X, Building2 } from "lucide-react";
import clsx from "clsx";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { resolveImageUrl } from "@/lib/config";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface AppShellProps {
  navItems: NavItem[];
  brandName: string;
  brandSubtitle?: string;
  brandLogoUrl?: string | null;
  brandColor?: string;
  userName: string;
  userMeta: string;
  onLogout: () => void | Promise<void>;
  children: ReactNode;
}

export function AppShell({
  navItems,
  brandName,
  brandSubtitle,
  brandLogoUrl,
  brandColor,
  userName,
  userMeta,
  onLogout,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = navItems
    .filter((item) => pathname === item.href || pathname?.startsWith(item.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div
          className={clsx(
            "flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg text-white",
            !brandColor && "premium-gradient"
          )}
          style={brandColor ? { background: brandColor, boxShadow: `0 0 0 2px ${brandColor}` } : undefined}
        >
          {brandLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveImageUrl(brandLogoUrl) ?? undefined} alt={brandName} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{brandName}</p>
          {brandSubtitle && <p className="truncate text-[11px] text-muted">{brandSubtitle}</p>}
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-1">
        {navItems.map((item) => {
          const active = item === activeItem;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "flex items-center gap-2.5 rounded-lg border-l-2 px-2.5 py-1.5 text-[13px] font-medium transition-all duration-150",
                !active && "border-transparent text-muted hover:bg-surface-2 hover:text-foreground"
              )}
              style={
                active
                  ? {
                      borderLeftColor: brandColor ?? "var(--primary)",
                      background: `color-mix(in srgb, ${brandColor ?? "var(--primary)"} 14%, transparent)`,
                      color: brandColor ?? "var(--primary)",
                    }
                  : undefined
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2.5">
        <div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-foreground">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-foreground">{userName}</p>
            <p className="truncate text-[11px] text-muted">{userMeta}</p>
          </div>
          <button
            onClick={onLogout}
            aria-label="Log out"
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-danger-bg hover:text-danger cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-border bg-surface lg:block">{sidebarContent}</aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="elevated absolute left-0 top-0 h-full w-64 bg-surface">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1.5 text-muted hover:bg-surface-2 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex h-12 items-center justify-between gap-3 border-b border-border/60 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-1.5 text-muted hover:bg-surface-2 lg:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            {activeItem && (
              <p className="min-w-0 truncate text-[13px] font-medium text-muted">
                {brandName} <span className="mx-1.5 text-border">/</span>{" "}
                <span className="text-foreground">{activeItem.label}</span>
              </p>
            )}
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
