import { AppRole } from '@/contexts/OrgContext';

export interface MockUser {
  id: string;
  email: string;
  displayName: string;
  role: AppRole;
}

export interface MockOrganization {
  id: string;
  name: string;
  plan: 'free' | 'pro';
  created_at: string;
  updated_at: string;
}

export const MOCK_USERS: MockUser[] = [
  { id: 'mock-admin-001', email: 'admin@demo.com', displayName: 'Admin User', role: 'super_admin' },
  { id: 'mock-manager-002', email: 'manager@demo.com', displayName: 'Manager User', role: 'org_admin' },
  { id: 'mock-user-003', email: 'user@demo.com', displayName: 'Regular User', role: 'member' },
  { id: 'mock-doctor-004', email: 'doctor@demo.com', displayName: 'Dr. Smith', role: 'org_admin' },
  { id: 'mock-client-005', email: 'client@demo.com', displayName: 'Client User', role: 'member' },
];

export const MOCK_ORG: MockOrganization = {
  id: 'mock-org-001',
  name: 'Demo Organization',
  plan: 'pro',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const MOCK_MEMBERS = MOCK_USERS.map((u, i) => ({
  id: `mock-member-${i}`,
  organization_id: MOCK_ORG.id,
  user_id: u.id,
  role: u.role,
  created_at: new Date().toISOString(),
}));

export const MOCK_AUDIT_LOGS = [
  { id: 'log-1', action: 'organization.created', entity_type: 'organization', entity_id: MOCK_ORG.id, user_id: MOCK_USERS[0].id, created_at: new Date(Date.now() - 3600000).toISOString(), metadata: {} },
  { id: 'log-2', action: 'member.added', entity_type: 'member', entity_id: MOCK_USERS[1].id, user_id: MOCK_USERS[0].id, created_at: new Date(Date.now() - 1800000).toISOString(), metadata: {} },
  { id: 'log-3', action: 'settings.updated', entity_type: 'organization', entity_id: MOCK_ORG.id, user_id: MOCK_USERS[1].id, created_at: new Date(Date.now() - 600000).toISOString(), metadata: {} },
];

const STORAGE_KEY = 'mock_auth_user';

export function getMockSession(): MockUser | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as MockUser;
  } catch {
    return null;
  }
}

export function setMockSession(user: MockUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearMockSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return !!(url && key && url !== '' && key !== '');
}
