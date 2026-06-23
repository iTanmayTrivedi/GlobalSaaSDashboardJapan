import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Languages, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TranslateTab = () => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tools', {
        body: {
          action: 'translate', text: input,
          sourceLang: sourceLang === 'auto' ? 'auto-detect' : sourceLang,
          targetLang: targetLang === 'en' ? 'English' : targetLang === 'ja' ? 'Japanese' : targetLang,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data.result);
    } catch (err: any) {
      toast.error(err.message || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2"><Languages className="h-5 w-5 text-primary" />{t('aiTranslateTitle')}</CardTitle>
        <CardDescription>{t('aiTranslateDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Select value={sourceLang} onValueChange={setSourceLang}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">{t('autoDetect')}</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
              <SelectItem value="ko">한국어</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
            </SelectContent>
          </Select>
          <span className="flex items-center text-muted-foreground">→</span>
          <Select value={targetLang} onValueChange={setTargetLang}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
              <SelectItem value="ko">한국어</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('enterTextToTranslate')} rows={4} />
        <Button onClick={handleTranslate} disabled={loading || !input.trim()}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('translating')}</> : t('aiTranslate')}
        </Button>
        {output && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-foreground whitespace-pre-wrap">{output}</p>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4 text-accent-foreground" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TranslateTab;
