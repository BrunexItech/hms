import { apiFetch } from "./api";
import {
  AuditLogEntry,
  Complaint,
  DashboardSummary,
  ModuleInfo,
  Organization,
  Property,
  RentInvoice,
  StaffMe,
  StaffMember,
  Tenancy,
  TenantMe,
  Unit,
  UnitAccessInfo,
  UtilityBill,
  VisitorBooking,
} from "./types";

// ── Auth ──────────────────────────────────────────────────────────────
export function staffLogin(email: string, password: string, mfa_code?: string) {
  return apiFetch<StaffMe>("/auth/staff/login", {
    method: "POST",
    body: JSON.stringify({ email, password, mfa_code }),
  });
}

export function staffLogout() {
  return apiFetch<{ message: string }>("/auth/staff/logout", { method: "POST", auth: "staff" });
}

export function getStaffMe() {
  return apiFetch<StaffMe>("/auth/staff/me", { auth: "staff" });
}

export function changePassword(current_password: string, new_password: string) {
  return apiFetch<{ message: string }>("/auth/staff/change-password", {
    method: "POST",
    auth: "staff",
    body: JSON.stringify({ current_password, new_password }),
  });
}

export function getUnitAccessInfo(accessSlug: string) {
  return apiFetch<UnitAccessInfo>(`/public/units/${accessSlug}`);
}

export function requestTenantAccessLink(accessSlug: string, email: string) {
  return apiFetch<{ message: string; dev_magic_link?: string }>(`/auth/tenant/${accessSlug}/request`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyTenantAccessToken(token: string) {
  return apiFetch<TenantMe>("/auth/tenant/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function tenantLogout() {
  return apiFetch<{ message: string }>("/auth/tenant/logout", { method: "POST", auth: "tenant" });
}

export function getTenantMe() {
  return apiFetch<TenantMe>("/auth/tenant/me", { auth: "tenant" });
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

export function getOrganization(orgId: string) {
  return apiFetch<Organization>(`/organizations/${orgId}`, { auth: "staff" });
}

export function updateOrganization(orgId: string, payload: { name?: string; logo_url?: string; primary_color?: string }) {
  return apiFetch<Organization>(`/organizations/${orgId}`, { method: "PATCH", auth: "staff", body: JSON.stringify(payload) });
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

export function listOrgAuditLogs(orgId: string) {
  return apiFetch<AuditLogEntry[]>(`/organizations/${orgId}/audit-logs`, { auth: "staff" });
}

export function getMyOrganization() {
  return apiFetch<Organization>("/organizations/me", { auth: "staff" });
}

export function updateMyOrganization(payload: { name?: string; logo_url?: string; primary_color?: string }) {
  return apiFetch<Organization>("/organizations/me", { method: "PATCH", auth: "staff", body: JSON.stringify(payload) });
}

export function getMyAuditLogs() {
  return apiFetch<AuditLogEntry[]>("/audit-logs/me", { auth: "staff" });
}

// ── My organization's modules (sidebar gating) ──────────────────────
export function getMyModules() {
  return apiFetch<ModuleInfo[]>("/modules/me", { auth: "staff" });
}

export function getTenantModules() {
  return apiFetch<ModuleInfo[]>("/modules/tenant-me", { auth: "tenant" });
}

// ── Dashboard ────────────────────────────────────────────────────────
export function getDashboardSummary() {
  return apiFetch<DashboardSummary>("/staff/dashboard/summary", { auth: "staff" });
}

// ── Team / staff management ─────────────────────────────────────────
export function listStaff() {
  return apiFetch<StaffMember[]>("/staff", { auth: "staff" });
}

export function inviteStaff(payload: { full_name: string; email: string; password: string }) {
  return apiFetch<StaffMember>("/staff", { method: "POST", auth: "staff", body: JSON.stringify(payload) });
}

export function deactivateStaff(memberId: string) {
  return apiFetch<StaffMember>(`/staff/${memberId}/deactivate`, { method: "POST", auth: "staff" });
}

export function resetStaffPassword(memberId: string, password: string) {
  return apiFetch<StaffMember>(`/staff/${memberId}/reset-password`, {
    method: "POST",
    auth: "staff",
    body: JSON.stringify({ password }),
  });
}

export function reactivateStaff(memberId: string) {
  return apiFetch<StaffMember>(`/staff/${memberId}/reactivate`, { method: "POST", auth: "staff" });
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

export function bulkCreateUtilityBills(payload: {
  property_id: string;
  utility_type: string;
  period_start: string;
  period_end: string;
  amount: number;
}) {
  return apiFetch<UtilityBill[]>("/staff/utility-bills/bulk", { method: "POST", auth: "staff", body: JSON.stringify(payload) });
}

export function updateUtilityBillStatus(id: string, status: UtilityBill["status"]) {
  return apiFetch<UtilityBill>(`/staff/utility-bills/${id}`, {
    method: "PATCH",
    auth: "staff",
    body: JSON.stringify({ status }),
  });
}

export function listTenantUtilityBills() {
  return apiFetch<UtilityBill[]>("/tenant/utility-bills", { auth: "tenant" });
}

// ── Rent & payments ──────────────────────────────────────────────────
export function listStaffRentInvoices() {
  return apiFetch<RentInvoice[]>("/staff/rent-invoices", { auth: "staff" });
}

export function createRentInvoice(payload: { unit_id: string; period_start: string; period_end: string; amount_due: number; due_date: string }) {
  return apiFetch<RentInvoice>("/staff/rent-invoices", { method: "POST", auth: "staff", body: JSON.stringify(payload) });
}

export function bulkCreateRentInvoices(payload: {
  property_id: string;
  period_start: string;
  period_end: string;
  amount_due: number;
  due_date: string;
}) {
  return apiFetch<RentInvoice[]>("/staff/rent-invoices/bulk", { method: "POST", auth: "staff", body: JSON.stringify(payload) });
}

export function recordRentPayment(invoiceId: string, payload: { amount: number; method: string; paid_at: string; notes?: string }) {
  return apiFetch<RentInvoice>(`/staff/rent-invoices/${invoiceId}/payments`, {
    method: "POST",
    auth: "staff",
    body: JSON.stringify(payload),
  });
}

export function listTenantRentInvoices() {
  return apiFetch<RentInvoice[]>("/tenant/rent-invoices", { auth: "tenant" });
}
