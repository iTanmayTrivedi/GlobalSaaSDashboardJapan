import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Languages, FileText, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceTabProps {
  onSendTo?: (target: 'translate' | 'summarize' | 'sentiment', text: string) => void;
}

const VoiceTab = ({ onSendTo }: VoiceTabProps) => {
  const { t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceLang, setVoiceLang] = useState('ja-JP');

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error(t('voiceNotSupported')); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      setVoiceText(transcript);
    };
    recognition.onerror = (event: any) => { setIsListening(false); toast.error(`Voice error: ${event.error}`); };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
    (window as any).__speechRecognition = recognition;
  };

  const stopVoiceInput = () => {
    const recognition = (window as any).__speechRecognition;
    if (recognition) { recognition.stop(); setIsListening(false); }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2"><Mic className="h-5 w-5 text-primary" />{t('aiVoiceTitle')}</CardTitle>
        <CardDescription>{t('aiVoiceDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Select value={voiceLang} onValueChange={setVoiceLang}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ja-JP">日本語 (Japanese)</SelectItem>
              <SelectItem value="en-US">English (US)</SelectItem>
              <SelectItem value="en-GB">English (UK)</SelectItem>
              <SelectItem value="zh-CN">中文 (Chinese)</SelectItem>
              <SelectItem value="ko-KR">한국어 (Korean)</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={isListening ? stopVoiceInput : startVoiceInput} variant={isListening ? 'destructive' : 'default'} className="gap-2">
            {isListening ? <><MicOff className="h-4 w-4" />{t('stopListening')}</> : <><Mic className="h-4 w-4" />{t('startListening')}</>}
          </Button>
        </div>
        {isListening && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <div className="h-3 w-3 animate-pulse rounded-full bg-destructive" />
            <span className="text-sm text-destructive">{t('listening')}</span>
          </div>
        )}
        <Textarea value={voiceText} onChange={(e) => setVoiceText(e.target.value)} placeholder={t('voiceTextPlaceholder')} rows={4} />
        {voiceText && onSendTo && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { onSendTo('translate', voiceText); toast.success(t('sentToTranslation')); }}>
              <Languages className="mr-2 h-4 w-4" />{t('sendToTranslation')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { onSendTo('summarize', voiceText); toast.success(t('sentToSummarizer')); }}>
              <FileText className="mr-2 h-4 w-4" />{t('sendToSummarizer')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { onSendTo('sentiment', voiceText); toast.success(t('sentToSentiment')); }}>
              <BarChart3 className="mr-2 h-4 w-4" />{t('sendToSentiment')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceTab;
