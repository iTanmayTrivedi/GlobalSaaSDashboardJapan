import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const MeetingMinutesTab = () => {
  const { t } = useLanguage();
  const [notes, setNotes] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [minutesLang, setMinutesLang] = useState('ja');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!notes.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tools', {
        body: { action: 'meeting_minutes', text: notes, meetingTitle, minutesLang },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data.result);
    } catch (err: any) {
      toast.error(err.message || t('minutesFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />{t('aiMinutesTitle')}</CardTitle>
        <CardDescription>{t('aiMinutesDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder={t('meetingTitlePlaceholder')} />
          <Select value={minutesLang} onValueChange={setMinutesLang}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ja">日本語</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('meetingNotesPlaceholder')} rows={6} />
        <Button onClick={handleGenerate} disabled={loading || !notes.trim()}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('generating')}</> : t('aiGenerateMinutes')}
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

export default MeetingMinutesTab;
