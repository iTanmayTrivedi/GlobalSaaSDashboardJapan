import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  delay?: number;
}

const StatsCard = ({ title, value, change, changeType, icon: Icon, delay = 0 }: StatsCardProps) => {
  const { t } = useLanguage();

  return (
    <Card className="animate-fade-in border-border/50 transition-shadow hover:shadow-md" style={{ animationDelay: `${delay}ms` }}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 sm:space-y-2">
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">{title}</p>
            <p className="font-heading text-2xl font-bold text-foreground sm:text-3xl">{value}</p>
            <p className={`text-xs font-medium ${
              changeType === 'positive' ? 'text-success' : 
              changeType === 'negative' ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {change} {t('vsLastMonth')}
            </p>
          </div>
          <div className="rounded-lg bg-accent p-2 sm:p-3">
            <Icon className="h-4 w-4 text-accent-foreground sm:h-5 sm:w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
