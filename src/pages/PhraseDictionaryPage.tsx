import { useState, useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import DashboardHeader from '@/components/DashboardHeader';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, BookOpen, ArrowRightLeft, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  phraseDictionary,
  keigoLevelLabels,
  situationLabels,
  type KeigoLevel,
  type Situation,
} from '@/data/keigo-dictionary';

const keigoColors: Record<KeigoLevel, string> = {
  sonkeigo: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  kenjougo: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  teineigo: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

const PhraseDictionaryPage = () => {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeLevel, setActiveLevel] = useState<KeigoLevel | null>(null);
  const [activeSituation, setActiveSituation] = useState<Situation | null>(null);

  const filtered = useMemo(() => {
    return phraseDictionary.filter(p => {
      if (activeLevel && p.keigoLevel !== activeLevel) return false;
      if (activeSituation && p.situation !== activeSituation) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.japanese.includes(q) ||
        p.reading.includes(q) ||
        p.english.toLowerCase().includes(q) ||
        p.casual.includes(q)
      );
    });
  }, [search, activeLevel, activeSituation]);

  const isJa = language === 'ja';

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-1">
            <BookOpen className="h-7 w-7 text-primary" />
            <h2 className="font-heading text-3xl font-bold text-foreground">
              {isJa ? 'ビジネス敬語辞典' : 'Business Keigo Dictionary'}
            </h2>
          </div>
          <p className="mt-1 text-muted-foreground">
            {isJa
              ? 'ビジネスシーンで使える敬語フレーズを検索できます。'
              : 'Search keigo phrases and patterns for common business situations.'}
          </p>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 space-y-4 animate-fade-in" style={{ animationDelay: '80ms' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isJa ? '日本語・英語で検索…' : 'Search in Japanese or English…'}
              className="pl-10"
            />
          </div>

          {/* Keigo level filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium text-muted-foreground self-center mr-1">
              {isJa ? '敬語レベル:' : 'Keigo Level:'}
            </span>
            {(Object.keys(keigoLevelLabels) as KeigoLevel[]).map(level => (
              <button
                key={level}
                onClick={() => setActiveLevel(activeLevel === level ? null : level)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 active:scale-95 ${
                  activeLevel === level
                    ? keigoColors[level] + ' ring-2 ring-primary/30'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {isJa ? keigoLevelLabels[level].ja : keigoLevelLabels[level].en}
              </button>
            ))}
          </div>

          {/* Situation filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium text-muted-foreground self-center mr-1">
              {isJa ? '場面:' : 'Situation:'}
            </span>
            {(Object.keys(situationLabels) as Situation[]).map(sit => (
              <button
                key={sit}
                onClick={() => setActiveSituation(activeSituation === sit ? null : sit)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 active:scale-95 ${
                  activeSituation === sit
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {isJa ? situationLabels[sit].ja : situationLabels[sit].en}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="mb-4 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '120ms' }}>
          {filtered.length} {isJa ? '件のフレーズ' : `phrase${filtered.length !== 1 ? 's' : ''}`}
        </p>

        {/* Phrase cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((phrase, idx) => (
            <Card
              key={phrase.id}
              className="group transition-shadow duration-300 hover:shadow-lg animate-fade-in"
              style={{ animationDelay: `${160 + idx * 40}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-snug text-foreground">
                    {phrase.japanese}
                  </CardTitle>
                  {phrase.note && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 shrink-0 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-sm">
                        {phrase.note}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{phrase.reading}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground">{phrase.english}</p>

                {/* Casual comparison */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ArrowRightLeft className="h-3 w-3" />
                  <span>{isJa ? 'カジュアル: ' : 'Casual: '}{phrase.casual}</span>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${keigoColors[phrase.keigoLevel]}`}>
                    {isJa ? keigoLevelLabels[phrase.keigoLevel].ja : keigoLevelLabels[phrase.keigoLevel].en}
                  </span>
                  <Badge variant="outline" className="text-[11px]">
                    {isJa ? situationLabels[phrase.situation].ja : situationLabels[phrase.situation].en}
                  </Badge>
                </div>

                {/* Example */}
                <div className="rounded-lg bg-muted/60 p-3 text-sm space-y-1">
                  <p className="font-medium text-foreground">{phrase.example}</p>
                  <p className="text-muted-foreground text-xs">{phrase.exampleTranslation}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground animate-fade-in">
            <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p>{isJa ? 'フレーズが見つかりませんでした。' : 'No phrases found.'}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PhraseDictionaryPage;
