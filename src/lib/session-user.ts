/** Client-safe session user type (no next/headers / prisma). */
export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  plan: string;
  creditsRemaining: number;
  onboardingComplete: boolean;
  darkMode: boolean;
  companyName: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  businessDescription: string | null;
  services: string | null;
  idealCustomer: string | null;
  serviceAreas: string | null;
  mainGoal: string | null;
  subscriptionStatus?: string | null;
  isActive?: boolean;
  adminNotes?: string | null;
  /** Permission keys for admin staff (empty for agency users) */
  permissions?: string[];
  /** True when a SUPER_ADMIN is viewing the app as this customer */
  impersonating?: boolean;
  /** Real admin id when impersonating */
  realAdminId?: string;
};
