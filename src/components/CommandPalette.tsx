import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useOrg } from '@/contexts/OrgContext';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard, Sparkles, BookOpen, Users, FileText, CreditCard,
  Settings, Languages, Mail, ShieldCheck, ClipboardList, FileUser,
  BarChart3, Mic, Moon, Sun, Globe,
} from 'lucide-react';

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { isOrgAdmin } = useOrg();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const pages = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard'), show: true },
    { path: '/ai-tools', icon: Sparkles, label: t('aiTools'), show: true },
    { path: '/phrase-dictionary', icon: BookOpen, label: language === 'ja' ? '敬語辞典' : 'Keigo Dictionary', show: true },
    { path: '/members', icon: Users, label: t('members'), show: isOrgAdmin },
    { path: '/audit-log', icon: FileText, label: t('auditLog'), show: isOrgAdmin },
    { path: '/billing', icon: CreditCard, label: t('billing'), show: isOrgAdmin },
    { path: '/settings', icon: Settings, label: t('settings'), show: true },
  ];

  const aiTools = [
    { label: language === 'ja' ? '翻訳' : 'Translate', icon: Languages },
    { label: language === 'ja' ? '要約' : 'Summarize', icon: FileText },
    { label: language === 'ja' ? '音声入力' : 'Voice Input', icon: Mic },
    { label: language === 'ja' ? '感情分析' : 'Sentiment', icon: BarChart3 },
    { label: language === 'ja' ? 'メール作成' : 'Email Composer', icon: Mail },
    { label: language === 'ja' ? '敬語チェック' : 'Keigo Checker', icon: ShieldCheck },
    { label: language === 'ja' ? '議事録' : 'Meeting Minutes', icon: ClipboardList },
    { label: language === 'ja' ? '履歴書分析' : 'Resume Analyzer', icon: FileUser },
  ];

  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.toggle('dark');
    localStorage.setItem('theme', root.classList.contains('dark') ? 'dark' : 'light');
    setOpen(false);
  };

  const toggleLang = () => {
    setLanguage(language === 'en' ? 'ja' : 'en');
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={language === 'ja' ? 'ページやツールを検索…' : 'Search pages, tools, actions…'} />
      <CommandList>
        <CommandEmpty>{language === 'ja' ? '結果が見つかりません' : 'No results found.'}</CommandEmpty>

        <CommandGroup heading={language === 'ja' ? 'ページ' : 'Pages'}>
          {pages.filter((p) => p.show).map((item) => (
            <CommandItem key={item.path} onSelect={() => go(item.path)} className="gap-2">
              <item.icon className="h-4 w-4 text-muted-foreground" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={language === 'ja' ? 'AIツール' : 'AI Tools'}>
          {aiTools.map((tool) => (
            <CommandItem key={tool.label} onSelect={() => go('/ai-tools')} className="gap-2">
              <tool.icon className="h-4 w-4 text-muted-foreground" />
              {tool.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={language === 'ja' ? 'アクション' : 'Actions'}>
          <CommandItem onSelect={toggleTheme} className="gap-2">
            <Sun className="h-4 w-4 text-muted-foreground" />
            {language === 'ja' ? 'テーマ切替（ライト/ダーク）' : 'Toggle Theme (Light/Dark)'}
          </CommandItem>
          <CommandItem onSelect={toggleLang} className="gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            {language === 'ja' ? '言語切替 → English' : 'Switch Language → 日本語'}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
