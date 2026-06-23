import { useLanguage } from '@/i18n/LanguageContext';
import DashboardHeader from '@/components/DashboardHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Languages, FileText, Mic, BarChart3, Mail, ShieldCheck, ClipboardList, FileUser } from 'lucide-react';
import TranslateTab from '@/components/ai-tools/TranslateTab';
import SummarizeTab from '@/components/ai-tools/SummarizeTab';
import VoiceTab from '@/components/ai-tools/VoiceTab';
import SentimentTab from '@/components/ai-tools/SentimentTab';
import EmailComposerTab from '@/components/ai-tools/EmailComposerTab';
import KeigoCheckerTab from '@/components/ai-tools/KeigoCheckerTab';
import MeetingMinutesTab from '@/components/ai-tools/MeetingMinutesTab';
import ResumeAnalyzerTab from '@/components/ai-tools/ResumeAnalyzerTab';

const AIToolsPage = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 animate-fade-in">
          <h2 className="font-heading text-3xl font-bold text-foreground">{t('aiToolsTitle')}</h2>
          <p className="mt-1 text-muted-foreground">{t('aiToolsSubtitle')}</p>
        </div>

        <Tabs defaultValue="translate" className="animate-fade-in">
          <TabsList className="mb-6 flex w-full flex-wrap gap-1">
            <TabsTrigger value="translate" className="gap-2"><Languages className="h-4 w-4" /><span className="hidden sm:inline">{t('aiTranslate')}</span></TabsTrigger>
            <TabsTrigger value="summarize" className="gap-2"><FileText className="h-4 w-4" /><span className="hidden sm:inline">{t('aiSummarize')}</span></TabsTrigger>
            <TabsTrigger value="voice" className="gap-2"><Mic className="h-4 w-4" /><span className="hidden sm:inline">{t('aiVoice')}</span></TabsTrigger>
            <TabsTrigger value="sentiment" className="gap-2"><BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">{t('aiSentiment')}</span></TabsTrigger>
            <TabsTrigger value="email" className="gap-2"><Mail className="h-4 w-4" /><span className="hidden sm:inline">{t('aiEmail')}</span></TabsTrigger>
            <TabsTrigger value="keigo" className="gap-2"><ShieldCheck className="h-4 w-4" /><span className="hidden sm:inline">{t('aiKeigo')}</span></TabsTrigger>
            <TabsTrigger value="minutes" className="gap-2"><ClipboardList className="h-4 w-4" /><span className="hidden sm:inline">{t('aiMinutes')}</span></TabsTrigger>
            <TabsTrigger value="resume" className="gap-2"><FileUser className="h-4 w-4" /><span className="hidden sm:inline">{t('aiResume')}</span></TabsTrigger>
          </TabsList>

          <TabsContent value="translate"><TranslateTab /></TabsContent>
          <TabsContent value="summarize"><SummarizeTab /></TabsContent>
          <TabsContent value="voice"><VoiceTab /></TabsContent>
          <TabsContent value="sentiment"><SentimentTab /></TabsContent>
          <TabsContent value="email"><EmailComposerTab /></TabsContent>
          <TabsContent value="keigo"><KeigoCheckerTab /></TabsContent>
          <TabsContent value="minutes"><MeetingMinutesTab /></TabsContent>
          <TabsContent value="resume"><ResumeAnalyzerTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AIToolsPage;
