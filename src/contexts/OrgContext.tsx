import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MOCK_ORG, MOCK_MEMBERS, MOCK_USERS, isSupabaseConfigured } from '@/lib/mock-auth';

export type AppRole = 'super_admin' | 'org_admin' | 'member';
export type SubscriptionPlan = 'free' | 'pro';

export interface Organization {
  id: string;
  name: string;
  plan: SubscriptionPlan;
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

interface OrgContextType {
  organizations: Organization[];
  currentOrg: Organization | null;
  currentRole: AppRole | null;
  members: OrgMember[];
  loading: boolean;
  switchOrg: (orgId: string) => Promise<void>;
  createOrg: (name: string, role?: AppRole) => Promise<Organization | null>;
  refreshOrgs: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  canManageMembers: boolean;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, mockUser, authMode } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [currentRole, setCurrentRole] = useState<AppRole | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------- MOCK MODE ----------
  useEffect(() => {
    if (authMode !== 'demo') return;
    if (!mockUser) {
      setOrganizations([]);
      setCurrentOrg(null);
      setCurrentRole(null);
      setMembers([]);
      setLoading(false);
      return;
    }
    setOrganizations([MOCK_ORG as Organization]);
    setCurrentOrg(MOCK_ORG as Organization);
    setCurrentRole(mockUser.role);
    setMembers(MOCK_MEMBERS as OrgMember[]);
    setLoading(false);
  }, [authMode, mockUser]);

  // ---------- SUPABASE MODE ----------
  const fetchOrgs = useCallback(async () => {
    if (authMode !== 'supabase' || !user || !isSupabaseConfigured()) { setLoading(false); return; }

    setLoading(true);
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Failed to fetch org memberships:', memberError);
        setLoading(false);
        return;
      }

      if (!memberData || memberData.length === 0) {
        setOrganizations([]); setCurrentOrg(null); setCurrentRole(null); setLoading(false);
        return;
      }

      const orgIds = memberData.map(m => m.organization_id);
      const { data: orgs, error: orgError } = await supabase.from('organizations').select('*').in('id', orgIds);
      if (orgError) {
        console.error('Failed to fetch organizations:', orgError);
        setLoading(false);
        return;
      }
      const orgList = (orgs || []) as Organization[];
      setOrganizations(orgList);

      const { data: profile } = await supabase.from('profiles').select('current_organization_id').eq('user_id', user.id).maybeSingle();
      const savedOrgId = profile?.current_organization_id;
      const selectedOrg = orgList.find(o => o.id === savedOrgId) || orgList[0] || null;

      if (selectedOrg) {
        setCurrentOrg(selectedOrg);
        const membership = memberData.find(m => m.organization_id === selectedOrg.id);
        setCurrentRole((membership?.role as AppRole) || null);
      }
    } catch (err) {
      console.error('OrgContext fetchOrgs error:', err);
    }
    setLoading(false);
  }, [user, authMode]);

  const refreshMembers = useCallback(async () => {
    if (authMode === 'demo') {
      setMembers(MOCK_MEMBERS as OrgMember[]);
      return;
    }
    if (!currentOrg || !isSupabaseConfigured()) return;
    try {
      const { data } = await supabase.from('organization_members').select('*').eq('organization_id', currentOrg.id);
      setMembers((data || []) as OrgMember[]);
    } catch {}
  }, [currentOrg, authMode]);

  useEffect(() => {
    if (authMode === 'supabase') {
      if (user) {
        setLoading(true);
        fetchOrgs();
      } else {
        setOrganizations([]);
        setCurrentOrg(null);
        setCurrentRole(null);
        setLoading(false);
      }
    }
    // Safety timeout: never leave loading stuck
    const timeout = setTimeout(() => setLoading(false), 6000);
    return () => clearTimeout(timeout);
  }, [fetchOrgs, authMode, user]);
  useEffect(() => { refreshMembers(); }, [refreshMembers]);

  const switchOrg = async (orgId: string) => {
    if (authMode === 'demo') return;
    const org = organizations.find(o => o.id === orgId);
    if (!org || !user) return;
    setCurrentOrg(org);
    try {
      const { data: membership } = await supabase.from('organization_members').select('role').eq('organization_id', orgId).eq('user_id', user.id).maybeSingle();
      setCurrentRole((membership?.role as AppRole) || null);
      await supabase.from('profiles').update({ current_organization_id: orgId }).eq('user_id', user.id);
    } catch {}
  };

  const createOrg = async (name: string, role?: AppRole): Promise<Organization | null> => {
    if (authMode === 'demo') {
      // Mock: just return existing org
      return MOCK_ORG as Organization;
    }
    if (!user || !isSupabaseConfigured()) return null;
    const { data: orgId, error } = await supabase.rpc('create_org_with_member', { _name: name, _role: role || 'org_admin' });
    if (error || !orgId) throw new Error(error?.message || 'Failed to create organization');
    await fetchOrgs();
    const { data: newOrg } = await supabase.from('organizations').select('*').eq('id', orgId).single();
    return (newOrg as Organization) || null;
  };

  const isSuperAdmin = currentRole === 'super_admin';
  const isOrgAdmin = currentRole === 'org_admin' || isSuperAdmin;
  const canManageMembers = isOrgAdmin;

  return (
    <OrgContext.Provider value={{
      organizations, currentOrg, currentRole, members, loading,
      switchOrg, createOrg, refreshOrgs: fetchOrgs, refreshMembers,
      isSuperAdmin, isOrgAdmin, canManageMembers,
    }}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
};
