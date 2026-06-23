import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { isSupabaseConfigured } from '@/lib/mock-auth';
import DashboardHeader from '@/components/DashboardHeader';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Users, TrendingUp, ShoppingCart, Clock, Download, Languages, FileText as FileTextIcon, Mic, BarChart3, Sparkles, Mail, ShieldCheck, ClipboardList } from 'lucide-react';
import { formatCurrency, formatRelativeTime, formatNumber, formatPercent, formatJapaneseEraDate } from '@/i18n/formatters';
import AIChatWidget from '@/components/AIChatWidget';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

type TimeRange = 'daily' | 'weekly' | 'monthly';

const generateChartData = (range: TimeRange) => {
  const points = range === 'daily' ? 7 : range === 'weekly' ? 4 : 12;
  return Array.from({ length: points }, (_, i) => ({
    name: range === 'daily' ? `Day ${i + 1}` : range === 'weekly' ? `W${i + 1}` : `M${i + 1}`,
    revenue: Math.floor(Math.random() * 5000) + 2000,
    users: Math.floor(Math.random() * 300) + 100,
  }));
};

const Dashboard = () => {
  const { user, mockUser, authMode } = useAuth();
  const navigate = useNavigate();
  const { currentOrg, currentRole, isOrgAdmin } = useOrg();
  const { t, language } = useLanguage();
  const [displayName, setDisplayName] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');

  useEffect(() => {
    if (authMode === 'demo' && mockUser) {
      setDisplayName(mockUser.displayName);
      return;
    }
    if (authMode === 'supabase' && user && isSupabaseConfigured()) {
      const fetchProfile = async () => {
        try {
          const { data } = await supabase.from('profiles').select('display_name, language').eq('user_id', user.id).maybeSingle();
          if (data) setDisplayName(data.display_name || user.email || '');
        } catch {}
      };
      fetchProfile();
    }
  }, [user, mockUser, authMode]);

  const chartData = useMemo(() => generateChartData(timeRange), [timeRange]);

  const activities = [
    { text: t('activityNewUser'), minutesAgo: 5 },
    { text: t('activityOrderPlaced'), minutesAgo: 12 },
    { text: t('activityPaymentReceived'), minutesAgo: 60 },
    { text: t('activityReportGenerated'), minutesAgo: 180 },
    { text: t('activitySettingsUpdated'), minutesAgo: 300 },
  ];

  const exportCsv = () => {
    const headers = ['Name', 'Revenue', 'Users'];
    const rows = chartData.map(d => [d.name, d.revenue, d.users].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const userName = displayName || mockUser?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8">
        <div className="mb-6 animate-fade-in sm:mb-8">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {t('welcomeBack')}, {userName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {currentOrg?.name && <span className="font-medium text-foreground">{currentOrg.name}</span>}
            {' — '}{t('dashboardSubtitle')}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground/70">
            {formatJapaneseEraDate(new Date(), language)}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title={t('totalRevenue')} value={formatCurrency(45231, language)} change="+20.1%" changeType="positive" icon={DollarSign} delay={0} />
          <StatsCard title={t('activeUsers')} value={formatNumber(2350, language)} change="+15.3%" changeType="positive" icon={Users} delay={100} />
          <StatsCard title={t('conversionRate')} value={formatPercent(3.2, language)} change="-0.4%" changeType="negative" icon={TrendingUp} delay={200} />
          <StatsCard title={t('totalOrders')} value={formatNumber(1234, language)} change="+8.7%" changeType="positive" icon={ShoppingCart} delay={300} />
        </div>

        {/* Charts Section — visible to org_admin and super_admin only */}
        {isOrgAdmin && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="animate-fade-in border-border/50" style={{ animationDelay: '400ms' }}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg">{t('revenue')}</CardTitle>
                <div className="flex items-center gap-2">
                  <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                    <TabsList className="h-8">
                      <TabsTrigger value="daily" className="text-xs px-2">{t('daily')}</TabsTrigger>
                      <TabsTrigger value="weekly" className="text-xs px-2">{t('weekly')}</TabsTrigger>
                      <TabsTrigger value="monthly" className="text-xs px-2">{t('monthly')}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={exportCsv} title={t('exportCsv')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#colorRevenue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="animate-fade-in border-border/50" style={{ animationDelay: '500ms' }}>
              <CardHeader>
                <CardTitle className="font-heading text-lg">{t('users')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                    <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Tools Quick Access */}
        <div className="mt-8">
          <Card className="animate-fade-in border-border/50" style={{ animationDelay: '550ms' }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t('aiTools')}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/ai-tools')}>
                {t('aiToolsTitle')} →
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Languages, label: t('aiTranslate'), desc: t('aiTranslateDesc'), tab: 'translate' },
                  { icon: FileTextIcon, label: t('aiSummarize'), desc: t('aiSummarizeDesc'), tab: 'summarize' },
                  { icon: Mail, label: t('aiEmail'), desc: t('aiEmailDesc'), tab: 'email' },
                  { icon: ShieldCheck, label: t('aiKeigo'), desc: t('aiKeigoDesc'), tab: 'keigo' },
                  { icon: ClipboardList, label: t('aiMinutes'), desc: t('aiMinutesDesc'), tab: 'minutes' },
                  { icon: Mic, label: t('aiVoice'), desc: t('aiVoiceDesc'), tab: 'voice' },
                  { icon: BarChart3, label: t('aiSentiment'), desc: t('aiSentimentDesc'), tab: 'sentiment' },
                ].map(tool => (
                  <button
                    key={tool.tab}
                    onClick={() => navigate('/ai-tools')}
                    className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 text-left transition-colors hover:bg-accent/50"
                  >
                    <div className="rounded-lg bg-accent p-2">
                      <tool.icon className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tool.label}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{tool.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card className="animate-fade-in border-border/50" style={{ animationDelay: '600ms' }}>
            <CardHeader>
              <CardTitle className="font-heading text-lg">{t('recentActivity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-accent p-2">
                        <Clock className="h-3.5 w-3.5 text-accent-foreground" />
                      </div>
                      <span className="text-sm text-foreground">{activity.text}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(activity.minutesAgo, language)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <AIChatWidget />
      </main>
    </div>
  );
};

export default Dashboard;
