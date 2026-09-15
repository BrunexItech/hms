export type StaffRole = "super_admin" | "owner" | "manager";

export interface StaffMe {
  id: string;
  email: string;
  full_name: string;
  role: StaffRole;
  organization_id: string | null;
  mfa_enabled: boolean;
}

export interface TenantMe {
  tenancy_id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  unit_id: string;
  unit_name: string;
  property_name: string;
  organization_id: string;
  organization_name: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  is_active: boolean;
  created_at: string;
}

export interface Property {
  id: string;
  name: string;
  address: string | null;
  unit_count: number;
  created_at: string;
}

export type UnitStatus = "vacant" | "occupied";

export interface Unit {
  id: string;
  property_id: string;
  name: string;
  status: UnitStatus;
  access_slug: string;
  created_at: string;
}

export type TenancyStatus = "active" | "vacated" | "disabled";

export interface Tenancy {
  id: string;
  unit_id: string;
  unit_name: string;
  property_name: string;
  tenant_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: TenancyStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export interface ModuleInfo {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string;
  enabled: boolean;
}

export type ComplaintStatus = "open" | "in_progress" | "resolved" | "closed";
export type ComplaintPriority = "low" | "medium" | "high";

export interface Complaint {
  id: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  created_at: string;
  tenant_name?: string | null;
  unit_name?: string | null;
}

export type VisitorStatus = "pending" | "approved" | "denied" | "checked_in" | "checked_out";

export interface VisitorBooking {
  id: string;
  visitor_name: string;
  visitor_phone: string | null;
  visit_date: string;
  expected_time: string | null;
  purpose: string | null;
  status: VisitorStatus;
  created_at: string;
  tenant_name?: string | null;
  unit_name?: string | null;
}

export type UtilityType = "water" | "electricity" | "garbage" | "other";
export type UtilityBillStatus = "pending" | "paid" | "overdue";

export interface UtilityBill {
  id: string;
  unit_id: string;
  unit_name?: string | null;
  property_name?: string | null;
  utility_type: UtilityType;
  period_start: string;
  period_end: string;
  amount: number;
  status: UtilityBillStatus;
  created_at: string;
}

export interface UnitAccessInfo {
  unit_name: string;
  property_name: string;
  organization_name: string;
  organization_logo_url: string | null;
  organization_primary_color: string;
}
