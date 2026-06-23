import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BarChart3, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SentimentTab = () => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSentiment = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tools', {
        body: { action: 'sentiment', text: input },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      try { setOutput(JSON.parse(data.result)); } catch { setOutput({ summary: data.result }); }
    } catch (err: any) {
      toast.error(err.message || 'Sentiment analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const sentimentColor = (s: string) => {
    switch (s) {
      case 'positive': return 'text-green-600 dark:text-green-400';
      case 'negative': return 'text-red-600 dark:text-red-400';
      case 'mixed': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />{t('aiSentimentTitle')}</CardTitle>
        <CardDescription>{t('aiSentimentDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('enterTextForSentiment')} rows={4} />
        <Button onClick={handleSentiment} disabled={loading || !input.trim()}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('analyzing')}</> : t('aiAnalyze')}
        </Button>
        {output && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            {output.sentiment && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">{t('sentimentLabel')}:</span>
                <span className={`text-lg font-bold capitalize ${sentimentColor(output.sentiment)}`}>{output.sentiment}</span>
                {output.confidence && <span className="text-xs text-muted-foreground">({output.confidence}%)</span>}
              </div>
            )}
            {output.emotions?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {output.emotions.map((e: string, i: number) => (
                  <span key={i} className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">{e}</span>
                ))}
              </div>
            )}
            {output.summary && <p className="text-sm text-foreground">{output.summary}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SentimentTab;
