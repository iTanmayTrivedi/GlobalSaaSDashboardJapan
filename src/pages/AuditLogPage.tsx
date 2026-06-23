import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { isSupabaseConfigured, MOCK_AUDIT_LOGS } from '@/lib/mock-auth';
import DashboardHeader from '@/components/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/i18n/formatters';

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  user_id: string | null;
  created_at: string;
}

const AuditLogPage = () => {
  const { authMode } = useAuth();
  const { currentOrg } = useOrg();
  const { t, language } = useLanguage();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authMode === 'demo') {
      setLogs(MOCK_AUDIT_LOGS as AuditEntry[]);
      setLoading(false);
      return;
    }
    const fetchLogs = async () => {
      if (!currentOrg || !isSupabaseConfigured()) { setLoading(false); return; }
      try {
        const { data } = await supabase.from('audit_logs').select('*').eq('organization_id', currentOrg.id).order('created_at', { ascending: false }).limit(100);
        setLogs((data || []) as AuditEntry[]);
      } catch {}
      setLoading(false);
    };
    fetchLogs();
  }, [currentOrg, authMode]);

  const getMinutesAgo = (dateStr: string) => Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 animate-fade-in">
          <h2 className="font-heading text-3xl font-bold text-foreground">{t('auditLogTitle')}</h2>
          <p className="mt-1 text-muted-foreground">{t('auditLogSubtitle')}</p>
        </div>

        <Card className="animate-fade-in border-border/50">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : logs.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">{t('noLogs')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('action')}</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>{t('user')}</TableHead>
                    <TableHead>{t('timestamp')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.entity_type || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{log.user_id?.slice(0, 8) || '—'}...</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatRelativeTime(getMinutesAgo(log.created_at), language)}</TableCell>
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

export default AuditLogPage;
