import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const KeigoCheckerTab = () => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCheck = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tools', {
        body: { action: 'keigo_check', text: input },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data.result);
    } catch (err: any) {
      toast.error(err.message || t('keigoCheckFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />{t('aiKeigoTitle')}</CardTitle>
        <CardDescription>{t('aiKeigoDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('keigoPlaceholder')} rows={4} />
        <Button onClick={handleCheck} disabled={loading || !input.trim()}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('checking')}</> : t('aiCheckKeigo')}
        </Button>
        {output && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                <ReactMarkdown>{output}</ReactMarkdown>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                {copied ? <Check className="h-4 w-4 text-accent-foreground" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KeigoCheckerTab;
