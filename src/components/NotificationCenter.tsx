import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X, Users, CreditCard, ShieldCheck, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/i18n/LanguageContext';
import { formatRelativeTime } from '@/i18n/formatters';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  minutesAgo: number;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

const NotificationCenter = () => {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<Notification[]>(() => [
    { id: '1', icon: Users, title: language === 'ja' ? '新規メンバー参加' : 'New member joined', description: language === 'ja' ? '田中太郎さんがチームに参加しました' : 'Tanaka Taro joined the team', minutesAgo: 3, read: false, type: 'info' },
    { id: '2', icon: CreditCard, title: language === 'ja' ? '支払い完了' : 'Payment received', description: language === 'ja' ? '¥150,000の支払いが確認されました' : '$1,000 payment confirmed', minutesAgo: 15, read: false, type: 'success' },
    { id: '3', icon: ShieldCheck, title: language === 'ja' ? 'セキュリティ通知' : 'Security alert', description: language === 'ja' ? '新しいデバイスからのログインが検出されました' : 'New device login detected', minutesAgo: 45, read: false, type: 'warning' },
    { id: '4', icon: FileText, title: language === 'ja' ? 'レポート完了' : 'Report ready', description: language === 'ja' ? '月次レポートが生成されました' : 'Monthly report generated', minutesAgo: 120, read: true, type: 'info' },
    { id: '5', icon: Settings, title: language === 'ja' ? '設定更新' : 'Settings updated', description: language === 'ja' ? '組織の設定が更新されました' : 'Org settings were updated', minutesAgo: 240, read: true, type: 'info' },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const dismiss = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={() => setOpen(!open)}>
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
            {unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-heading text-sm font-semibold text-foreground">
              {t('notifications')}
            </h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary" onClick={markAllRead}>
                <CheckCheck className="h-3 w-3" /> {t('markAllRead')}
              </Button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">{t('noNotifications')}</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={cn(
                    'group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-0',
                    !n.read && 'bg-accent/30'
                  )}
                  onClick={() => markRead(n.id)}
                >
                  <div className={cn(
                    'mt-0.5 rounded-lg p-2',
                    n.type === 'success' && 'bg-success/10 text-success',
                    n.type === 'warning' && 'bg-warning/10 text-warning',
                    n.type === 'info' && 'bg-accent text-accent-foreground',
                  )}>
                    <n.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn('text-sm', !n.read ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{n.title}</p>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{n.description}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">{formatRelativeTime(n.minutesAgo, language)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
