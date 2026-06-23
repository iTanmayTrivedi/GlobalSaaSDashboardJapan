import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Language } from '@/i18n/translations';
import { supabase } from '@/integrations/supabase/client';
import { isSupabaseConfigured } from '@/lib/mock-auth';
import DashboardHeader from '@/components/DashboardHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { getUserTimezone } from '@/i18n/formatters';
import { profileSchema, orgSettingsSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-error';

const SettingsPage = () => {
  const { user, mockUser, authMode } = useAuth();
  const { currentOrg, isOrgAdmin, refreshOrgs } = useOrg();
  const { language, setLanguage, t } = useLanguage();
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState(getUserTimezone());
  const [orgName, setOrgName] = useState('');
  const [saving, setSaving] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authMode === 'demo' && mockUser) {
      setDisplayName(mockUser.displayName);
      return;
    }
    if (authMode === 'supabase' && user && isSupabaseConfigured()) {
      const fetchProfile = async () => {
        try {
          const { data } = await supabase.from('profiles').select('display_name, language, timezone').eq('user_id', user.id).maybeSingle();
          if (data) {
            setDisplayName(data.display_name || '');
            setTimezone(data.timezone || getUserTimezone());
            if (data.language === 'ja' || data.language === 'en') setLanguage(data.language as Language);
          }
        } catch {}
      };
      fetchProfile();
    }
  }, [user, mockUser, authMode]);

  useEffect(() => { if (currentOrg) setOrgName(currentOrg.name); }, [currentOrg]);

  const handleSave = async () => {
    setFieldErrors({});
    const result = profileSchema.safeParse({ displayName });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach(issue => { errors[issue.path[0] as string] = issue.message; });
      setFieldErrors(errors);
      return;
    }

    if (authMode === 'demo') {
      toast.success(t('saved'));
      return;
    }

    if (!user || !isSupabaseConfigured()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ display_name: displayName, language, timezone }).eq('user_id', user.id);
      if (error) handleApiError(error);
      else toast.success(t('saved'));
    } catch (err) { handleApiError(err); }
    setSaving(false);
  };

  const handleOrgSave = async () => {
    if (!currentOrg) return;
    setFieldErrors({});
    const result = orgSettingsSchema.safeParse({ orgName });
    if (!result.success) { setFieldErrors({ orgName: result.error.issues[0]?.message || '' }); return; }

    if (authMode === 'demo') { toast.success(t('saved')); return; }

    if (!isSupabaseConfigured()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('organizations').update({ name: orgName.trim() }).eq('id', currentOrg.id);
      if (error) handleApiError(error);
      else { toast.success(t('saved')); refreshOrgs(); }
    } catch (err) { handleApiError(err); }
    setSaving(false);
  };

  const toggleDark = (checked: boolean) => {
    setDark(checked);
    if (checked) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  };

  const emailDisplay = authMode === 'demo' ? mockUser?.email || '' : user?.email || '';

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-8 animate-fade-in">
          <h2 className="font-heading text-3xl font-bold text-foreground">{t('settingsTitle')}</h2>
          <p className="mt-1 text-muted-foreground">{t('settingsSubtitle')}</p>
        </div>

        <Tabs defaultValue="profile" className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <TabsList className="mb-6">
            <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
            <TabsTrigger value="preferences">{t('preferences')}</TabsTrigger>
            {isOrgAdmin && <TabsTrigger value="organization">{t('organization')}</TabsTrigger>}
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-heading">{t('profile')}</CardTitle>
                <CardDescription>{t('displayNameDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('displayNameLabel')}</Label>
                  <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('displayNameLabel')} maxLength={100} />
                  {fieldErrors.displayName && <p className="text-xs text-destructive">{fieldErrors.displayName}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t('email')}</Label>
                  <Input value={emailDisplay} disabled className="text-muted-foreground" />
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? '...' : <><Check className="h-4 w-4" /> {t('saveChanges')}</>}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-heading">{t('preferences')}</CardTitle>
                <CardDescription>{t('languageDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t('language')}</Label>
                  <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t('english')}</SelectItem>
                      <SelectItem value="ja">{t('japanese')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('timezone')}</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Intl as any).supportedValuesOf('timeZone').map((tz: string) => (
                        <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t('timezoneDesc')}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('darkMode')}</Label>
                    <p className="text-xs text-muted-foreground">{t('darkModeDesc')}</p>
                  </div>
                  <Switch checked={dark} onCheckedChange={toggleDark} />
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? '...' : <><Check className="h-4 w-4" /> {t('saveChanges')}</>}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {isOrgAdmin && (
            <TabsContent value="organization">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="font-heading">{t('orgSettings')}</CardTitle>
                  <CardDescription>{t('organization')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('orgNameLabel')}</Label>
                    <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder={t('organizationName')} maxLength={100} />
                    {fieldErrors.orgName && <p className="text-xs text-destructive">{fieldErrors.orgName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>{t('plan')}</Label>
                    <Input value={currentOrg?.plan === 'pro' ? t('proPlan') : t('freePlan')} disabled className="w-48 text-muted-foreground" />
                  </div>
                  <Button onClick={handleOrgSave} disabled={saving} className="gap-2">
                    {saving ? '...' : <><Check className="h-4 w-4" /> {t('saveChanges')}</>}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default SettingsPage;
