import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EmailComposerTab = () => {
  const { t } = useLanguage();
  const [context, setContext] = useState('');
  const [recipient, setRecipient] = useState('');
  const [tone, setTone] = useState('formal');
  const [emailLang, setEmailLang] = useState('ja');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCompose = async () => {
    if (!context.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tools', {
        body: { action: 'compose_email', text: context, recipient, tone, emailLang },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data.result);
    } catch (err: any) {
      toast.error(err.message || t('emailComposeFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />{t('aiEmailTitle')}</CardTitle>
        <CardDescription>{t('aiEmailDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder={t('recipientPlaceholder')} />
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">{t('toneFormal')}</SelectItem>
              <SelectItem value="polite">{t('tonePolite')}</SelectItem>
              <SelectItem value="casual">{t('toneCasual')}</SelectItem>
              <SelectItem value="keigo">{t('toneKeigo')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={emailLang} onValueChange={setEmailLang}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ja">日本語</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder={t('emailContextPlaceholder')} rows={3} />
        <Button onClick={handleCompose} disabled={loading || !context.trim()}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('composing')}</> : t('aiComposeEmail')}
        </Button>
        {output && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-2">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-body">{output}</pre>
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

export default EmailComposerTab;
