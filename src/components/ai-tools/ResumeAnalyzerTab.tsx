import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUser, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const ResumeAnalyzerTab = () => {
  const { t, language } = useLanguage();
  const [resumeText, setResumeText] = useState('');
  const [resumeType, setResumeType] = useState<'rirekisho' | 'shokumukeirekisho' | 'english'>('shokumukeirekisho');
  const [targetIndustry, setTargetIndustry] = useState('general');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tools', {
        body: {
          action: 'resume_analyze',
          text: resumeText,
          resumeType,
          targetIndustry,
          resumeLang: language,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data.result || '');
    } catch (err: any) {
      toast.error(t('resumeAnalyzeFailed'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileUser className="h-5 w-5 text-primary" />
          {t('aiResumeTitle')}
        </CardTitle>
        <CardDescription>{t('aiResumeDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('resumeTypeLabel')}</label>
            <Select value={resumeType} onValueChange={(v) => setResumeType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shokumukeirekisho">{t('resumeTypeShokumu')}</SelectItem>
                <SelectItem value="rirekisho">{t('resumeTypeRirekisho')}</SelectItem>
                <SelectItem value="english">{t('resumeTypeEnglish')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('targetIndustryLabel')}</label>
            <Select value={targetIndustry} onValueChange={setTargetIndustry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">{t('industryGeneral')}</SelectItem>
                <SelectItem value="it">{t('industryIT')}</SelectItem>
                <SelectItem value="finance">{t('industryFinance')}</SelectItem>
                <SelectItem value="consulting">{t('industryConsulting')}</SelectItem>
                <SelectItem value="manufacturing">{t('industryManufacturing')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder={t('resumePlaceholder')}
          rows={10}
          className="font-mono text-sm"
        />

        <Button onClick={handleAnalyze} disabled={loading || !resumeText.trim()} className="w-full gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUser className="h-4 w-4" />}
          {loading ? t('analyzing') : t('aiAnalyzeResume')}
        </Button>

        {output && (
          <div className="relative rounded-lg border border-border bg-muted/50 p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="absolute right-2 top-2 gap-1"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
            <div className="prose prose-sm dark:prose-invert max-w-none pr-16">
              <ReactMarkdown>{output}</ReactMarkdown>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumeAnalyzerTab;
