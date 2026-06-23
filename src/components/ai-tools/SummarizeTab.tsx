import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const SummarizeTab = () => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSummarize = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tools', {
        body: { action: 'summarize', text: input },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data.result);
    } catch (err: any) {
      toast.error(err.message || 'Summarization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />{t('aiSummarizeTitle')}</CardTitle>
        <CardDescription>{t('aiSummarizeDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('enterTextToSummarize')} rows={6} />
        <Button onClick={handleSummarize} disabled={loading || !input.trim()}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('summarizing')}</> : t('aiSummarize')}
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

export default SummarizeTab;
