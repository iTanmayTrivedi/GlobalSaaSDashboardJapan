import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg, AppRole } from '@/contexts/OrgContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createOrgSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-error';
import { checkRateLimit } from '@/lib/rate-limit';

const Onboarding = () => {
  const { user, isAuthenticated, loading: authLoading, authMode } = useAuth();
  const { organizations, currentOrg, createOrg, loading: orgLoading } = useOrg();
  const { t } = useLanguage();
  const [orgName, setOrgName] = useState('');
  const [creating, setCreating] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const submittingRef = useRef(false);

  if (authLoading || orgLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (authMode === 'demo') return <Navigate to="/dashboard" replace />;
  // Only leave onboarding once an org is actually selected — prevents redirect ping-pong.
  if (currentOrg) return <Navigate to="/dashboard" replace />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError('');

    if (!checkRateLimit('create_org', { maxAttempts: 3, windowMs: 60_000 })) {
      toast.error(t('rateLimitExceeded'));
      return;
    }

    const result = createOrgSchema.safeParse({ orgName });
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message || '');
      return;
    }

    if (submittingRef.current) return;
    submittingRef.current = true;
    setCreating(true);

    try {
      const selectedRole = (user?.user_metadata?.selected_role as AppRole) || 'org_admin';
      const org = await createOrg(orgName.trim(), selectedRole);
      if (org) toast.success(t('orgCreated'));
    } catch (err: any) {
      handleApiError(err, err?.message || t('orgCreateError'));
    } finally {
      setCreating(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md animate-fade-in border-border/50 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 rounded-full bg-accent p-4">
            <Building2 className="h-8 w-8 text-accent-foreground" />
          </div>
          <CardTitle className="font-heading text-2xl">{t('createOrganization')}</CardTitle>
          <CardDescription>{t('onboardingSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">{t('organizationName')}</Label>
              <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder={t('organizationName')} required maxLength={100} disabled={creating} />
              {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={creating || !orgName.trim()}>
              {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : t('createOrganization')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
