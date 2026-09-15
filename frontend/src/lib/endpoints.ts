import { apiFetch } from "./api";
import { saveTokens } from "./auth-storage";
import {
  Complaint,
  ModuleInfo,
  Organization,
  Property,
  StaffMe,
  Tenancy,
  TenantMe,
  Unit,
  UnitAccessInfo,
  UtilityBill,
  VisitorBooking,
} from "./types";

interface TokenPair {
  access_token: string;
  refresh_token: string;
}

// ── Auth ──────────────────────────────────────────────────────────────
export async function staffLogin(email: string, password: string, mfa_code?: string) {
  const tokens = await apiFetch<TokenPair>("/auth/staff/login", {
    method: "POST",
    body: JSON.stringify({ email, password, mfa_code }),
  });
  saveTokens("staff", tokens);
  return tokens;
}

export function getStaffMe() {
  return apiFetch<StaffMe>("/auth/staff/me", { auth: "staff" });
}

export function getUnitAccessInfo(accessSlug: string) {
  return apiFetch<UnitAccessInfo>(`/public/units/${accessSlug}`);
}

export function requestTenantAccessLink(accessSlug: string, email: string) {
  return apiFetch<{ message: string }>(`/auth/tenant/${accessSlug}/request`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyTenantAccessToken(token: string) {
  const tokens = await apiFetch<TokenPair>("/auth/tenant/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
  saveTokens("tenant", tokens);
  return tokens;
}

export function getTenantMe() {
  return apiFetch<TenantMe>("/auth/tenant/me", { auth: "tenant" });
}

export function getTenantModules() {
  return apiFetch<ModuleInfo[]>("/modules/tenant-me", { auth: "tenant" });
}

// ── Organizations (super admin) ─────────────────────────────────────
export function listOrganizations() {
  return apiFetch<Organization[]>("/organizations", { auth: "staff" });
}

export function createOrganization(payload: {
  name: string;
  slug: string;
  owner_email: string;
  owner_password: string;
  owner_full_name: string;
  primary_color?: string;
}) {
  return apiFetch<Organization>("/organizations", {
    method: "POST",
    auth: "staff",
    body: JSON.stringify(payload),
  });
}

export function suspendOrganization(orgId: string) {
  return apiFetch<Organization>(`/organizations/${orgId}/suspend`, { method: "POST", auth: "staff" });
}

export function reactivateOrganization(orgId: string) {
  return apiFetch<Organization>(`/organizations/${orgId}/reactivate`, { method: "POST", auth: "staff" });
}

export function listOrgModules(orgId: string) {
  return apiFetch<ModuleInfo[]>(`/organizations/${orgId}/modules`, { auth: "staff" });
}

export function toggleOrgModule(orgId: string, moduleId: string, enabled: boolean) {
  return apiFetch<ModuleInfo>(`/organizations/${orgId}/modules/${moduleId}`, {
    method: "PUT",
    auth: "staff",
    body: JSON.stringify({ enabled }),
  });
}

export function getMyOrganization() {
  return apiFetch<Organization>("/organizations/me", { auth: "staff" });
}

export function updateMyOrganization(payload: { name?: string; logo_url?: string; primary_color?: string }) {
  return apiFetch<Organization>("/organizations/me", { method: "PATCH", auth: "staff", body: JSON.stringify(payload) });
}

// ── My organization's modules (sidebar gating) ──────────────────────
export function getMyModules() {
  return apiFetch<ModuleInfo[]>("/modules/me", { auth: "staff" });
}

// ── Properties / Units ───────────────────────────────────────────────
export function listProperties() {
  return apiFetch<Property[]>("/properties", { auth: "staff" });
}

export function createProperty(payload: { name: string; address?: string }) {
  return apiFetch<Property>("/properties", { method: "POST", auth: "staff", body: JSON.stringify(payload) });
}

export function deleteProperty(propertyId: string) {
  return apiFetch<void>(`/properties/${propertyId}`, { method: "DELETE", auth: "staff" });
}

export function listAllUnits() {
  return apiFetch<Unit[]>("/units", { auth: "staff" });
}

export function listUnits(propertyId: string) {
  return apiFetch<Unit[]>(`/properties/${propertyId}/units`, { auth: "staff" });
}

export function createUnit(propertyId: string, name: string) {
  return apiFetch<Unit>(`/properties/${propertyId}/units`, {
    method: "POST",
    auth: "staff",
    body: JSON.stringify({ name }),
  });
}

export function getUnitAccessLink(unitId: string) {
  return apiFetch<{ access_url: string; access_slug: string }>(`/units/${unitId}/access-link`, {
    auth: "staff",
  });
}

export function regenerateUnitAccessLink(unitId: string) {
  return apiFetch<{ access_url: string; access_slug: string }>(`/units/${unitId}/regenerate-access-link`, {
    method: "POST",
    auth: "staff",
  });
}

// ── Tenancies ─────────────────────────────────────────────────────────
export function listTenancies() {
  return apiFetch<Tenancy[]>("/tenancies", { auth: "staff" });
}

export function createTenancy(payload: {
  unit_id: string;
  full_name: string;
  email: string;
  phone?: string;
  start_date: string;
}) {
  return apiFetch<Tenancy>("/tenancies", { method: "POST", auth: "staff", body: JSON.stringify(payload) });
}

export function disableTenancy(tenancyId: string, reason?: string) {
  return apiFetch<Tenancy>(`/tenancies/${tenancyId}/disable`, {
    method: "POST",
    auth: "staff",
    body: JSON.stringify({ reason }),
  });
}

export function reactivateTenancy(tenancyId: string) {
  return apiFetch<Tenancy>(`/tenancies/${tenancyId}/reactivate`, { method: "POST", auth: "staff" });
}

// ── Complaints ───────────────────────────────────────────────────────
export function listStaffComplaints() {
  return apiFetch<Complaint[]>("/staff/complaints", { auth: "staff" });
}

export function updateComplaintStatus(id: string, status: Complaint["status"]) {
  return apiFetch<Complaint>(`/staff/complaints/${id}`, {
    method: "PATCH",
    auth: "staff",
    body: JSON.stringify({ status }),
  });
}

export function listTenantComplaints() {
  return apiFetch<Complaint[]>("/tenant/complaints", { auth: "tenant" });
}

export function createTenantComplaint(payload: { subject: string; description: string; priority: string }) {
  return apiFetch<Complaint>("/tenant/complaints", { method: "POST", auth: "tenant", body: JSON.stringify(payload) });
}

// ── Visitor bookings ─────────────────────────────────────────────────
export function listStaffVisitorBookings() {
  return apiFetch<VisitorBooking[]>("/staff/visitors", { auth: "staff" });
}

export function updateVisitorBookingStatus(id: string, status: VisitorBooking["status"]) {
  return apiFetch<VisitorBooking>(`/staff/visitors/${id}`, {
    method: "PATCH",
    auth: "staff",
    body: JSON.stringify({ status }),
  });
}

export function listTenantVisitorBookings() {
  return apiFetch<VisitorBooking[]>("/tenant/visitors", { auth: "tenant" });
}

export function createTenantVisitorBooking(payload: {
  visitor_name: string;
  visitor_phone?: string;
  visit_date: string;
  expected_time?: string;
  purpose?: string;
}) {
  return apiFetch<VisitorBooking>("/tenant/visitors", { method: "POST", auth: "tenant", body: JSON.stringify(payload) });
}

// ── Utilities ────────────────────────────────────────────────────────
export function listStaffUtilityBills() {
  return apiFetch<UtilityBill[]>("/staff/utility-bills", { auth: "staff" });
}

export function createUtilityBill(payload: {
  unit_id: string;
  utility_type: string;
  period_start: string;
  period_end: string;
  amount: number;
}) {
  return apiFetch<UtilityBill>("/staff/utility-bills", { method: "POST", auth: "staff", body: JSON.stringify(payload) });
}

export function listTenantUtilityBills() {
  return apiFetch<UtilityBill[]>("/tenant/utility-bills", { auth: "tenant" });
}
