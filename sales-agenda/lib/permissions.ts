export type Role = "OWNER" | "ADMIN" | "REGIONAL_MANAGER" | "MANAGER" | "AGENT" | "SECRETARY";

export const canManageTeam = (role: Role) =>
  role === "OWNER" || role === "ADMIN" || role === "REGIONAL_MANAGER" || role === "MANAGER";

export const canViewAllTenantData = (role: Role) =>
  role === "OWNER" || role === "ADMIN" || role === "REGIONAL_MANAGER" || role === "MANAGER";

export const canConfigureFramework = (role: Role) => role === "OWNER" || role === "ADMIN" || role === "REGIONAL_MANAGER";

// SECRETARY NO ve financials
export const canViewFinancials = (role: Role) => role !== "SECRETARY";

export const canCreateAppointment = (role: Role) =>
  role === "OWNER" || role === "ADMIN" || role === "REGIONAL_MANAGER" || role === "MANAGER" || role === "AGENT" || role === "SECRETARY";

export const canCreateSale = (role: Role) => role !== "SECRETARY";

export const canAdvanceContactStage = (role: Role) => role !== "SECRETARY";
