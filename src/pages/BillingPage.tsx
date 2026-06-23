import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { isSupabaseConfigured } from '@/lib/mock-auth';
import DashboardHeader from '@/components/DashboardHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap } from 'lucide-react';
import { toast } from 'sonner';

const BillingPage = () => {
  const { authMode } = useAuth();
  const { currentOrg, refreshOrgs, isOrgAdmin } = useOrg();
  const { t } = useLanguage();

  const handlePlanChange = async (plan: 'free' | 'pro') => {
    if (!currentOrg) return;
    if (authMode === 'demo') { toast.success(t('planUpdated')); return; }
    if (!isSupabaseConfigured()) return;
    try {
      const { error } = await supabase.from('organizations').update({ plan }).eq('id', currentOrg.id);
      if (error) toast.error(error.message);
      else { toast.success(t('planUpdated')); refreshOrgs(); }
    } catch (err) { toast.error('Failed to update plan'); }
  };

  const isPro = currentOrg?.plan === 'pro';

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-8 animate-fade-in">
          <h2 className="font-heading text-3xl font-bold text-foreground">{t('billingTitle')}</h2>
          <p className="mt-1 text-muted-foreground">{t('billingSubtitle')}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card className={`animate-fade-in border-border/50 ${!isPro ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading">{t('freePlan')}</CardTitle>
                {!isPro && <Badge>{t('currentPlan')}</Badge>}
              </div>
              <CardDescription>$0 / {t('monthly').toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {t('freeFeatures').split(', ').map((f, i) => (
                  <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> {f}</li>
                ))}
              </ul>
              {isPro && isOrgAdmin && (
                <Button variant="outline" className="w-full" onClick={() => handlePlanChange('free')}>{t('downgradeToFree')}</Button>
              )}
            </CardContent>
          </Card>

          <Card className={`animate-fade-in border-border/50 ${isPro ? 'ring-2 ring-primary' : ''}`} style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading flex items-center gap-2">
                  <Crown className="h-5 w-5 text-warning" /> {t('proPlan')}
                </CardTitle>
                {isPro && <Badge>{t('currentPlan')}</Badge>}
              </div>
              <CardDescription>$29 / {t('monthly').toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {t('proFeatures').split(', ').map((f, i) => (
                  <li key={i} className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> {f}</li>
                ))}
              </ul>
              {!isPro && isOrgAdmin && (
                <Button className="w-full" onClick={() => handlePlanChange('pro')}>{t('upgradeToPro')}</Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default BillingPage;
