import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { isSupabaseConfigured, MOCK_USERS } from '@/lib/mock-auth';
import DashboardHeader from '@/components/DashboardHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { AppRole } from '@/contexts/OrgContext';

interface MemberWithEmail {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  displayName?: string;
}

const MembersPage = () => {
  const { authMode } = useAuth();
  const { currentOrg, members, refreshMembers, canManageMembers } = useOrg();
  const { t } = useLanguage();
  const [memberDetails, setMemberDetails] = useState<MemberWithEmail[]>([]);

  useEffect(() => {
    if (authMode === 'demo') {
      setMemberDetails(members.map(m => {
        const mockUser = MOCK_USERS.find(u => u.id === m.user_id);
        return { ...m, role: m.role as AppRole, displayName: mockUser?.displayName || m.user_id.slice(0, 8) };
      }));
    } else {
      setMemberDetails(members.map(m => ({ ...m, role: m.role as AppRole })));
    }
  }, [members, authMode]);

  const handleRemoveMember = async (memberId: string) => {
    if (authMode === 'demo') { toast.success(t('memberRemoved')); return; }
    if (!isSupabaseConfigured()) return;
    try {
      const { error } = await supabase.from('organization_members').delete().eq('id', memberId);
      if (error) toast.error(t('memberError'));
      else { toast.success(t('memberRemoved')); refreshMembers(); }
    } catch { toast.error(t('memberError')); }
  };

  const handleChangeRole = async (memberId: string, newRole: AppRole) => {
    if (authMode === 'demo') { toast.success(t('saved')); return; }
    if (!isSupabaseConfigured()) return;
    try {
      const { error } = await supabase.from('organization_members').update({ role: newRole }).eq('id', memberId);
      if (error) toast.error(t('memberError'));
      else { toast.success(t('saved')); refreshMembers(); }
    } catch { toast.error(t('memberError')); }
  };

  const roleBadgeColor = (role: AppRole) => {
    switch (role) { case 'super_admin': return 'destructive'; case 'org_admin': return 'default'; case 'member': return 'secondary'; }
  };
  const roleLabel = (role: AppRole) => {
    switch (role) { case 'super_admin': return t('superAdmin'); case 'org_admin': return t('orgAdmin'); case 'member': return t('member'); }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 animate-fade-in">
          <h2 className="font-heading text-3xl font-bold text-foreground">{t('membersTitle')}</h2>
          <p className="mt-1 text-muted-foreground">{t('membersSubtitle')}</p>
        </div>

        <Card className="animate-fade-in border-border/50">
          <CardHeader>
            <CardTitle className="font-heading">{t('members')}</CardTitle>
            <CardDescription>{memberDetails.length} {t('members').toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            {memberDetails.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noMembers')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('user')}</TableHead>
                    <TableHead>{t('role')}</TableHead>
                    <TableHead>{t('timestamp')}</TableHead>
                    {canManageMembers && <TableHead />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberDetails.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm">{m.displayName || m.user_id.slice(0, 8) + '...'}</TableCell>
                      <TableCell>
                        {canManageMembers ? (
                          <Select value={m.role} onValueChange={(v) => handleChangeRole(m.id, v as AppRole)}>
                            <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">{t('member')}</SelectItem>
                              <SelectItem value="org_admin">{t('orgAdmin')}</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={roleBadgeColor(m.role)}>{roleLabel(m.role)}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                      {canManageMembers && (
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(m.id)} className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MembersPage;
