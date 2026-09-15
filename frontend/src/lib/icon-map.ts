import { Building2, Users, MessageSquareWarning, ScanLine, Receipt, LayoutGrid, LucideIcon } from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  "building-2": Building2,
  users: Users,
  "message-square-warning": MessageSquareWarning,
  "scan-line": ScanLine,
  receipt: Receipt,
  "layout-grid": LayoutGrid,
};

export function resolveIcon(key: string): LucideIcon {
  return iconMap[key] ?? LayoutGrid;
}
