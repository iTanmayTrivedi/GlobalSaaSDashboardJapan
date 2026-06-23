import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Language } from '@/i18n/translations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe, LogOut, Settings, LayoutDashboard, Users, FileText, CreditCard, Shield, ShieldCheck, UserRound, Sparkles, BookOpen, Building2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import OrgSwitcher from '@/components/OrgSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationCenter from '@/components/NotificationCenter';

const DashboardHeader = () => {
  const { user, mockUser, authMode, signOut } = useAuth();
  const { currentRole, isOrgAdmin, currentOrg } = useOrg();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleLanguage = () => setLanguage(language === 'en' ? 'ja' : 'en');

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard'), show: true },
    { path: '/ai-tools', icon: Sparkles, label: t('aiTools'), show: true },
    { path: '/phrase-dictionary', icon: BookOpen, label: language === 'ja' ? '敬語辞典' : 'Keigo', show: true },
    { path: '/members', icon: Users, label: t('members'), show: isOrgAdmin },
    { path: '/audit-log', icon: FileText, label: t('auditLog'), show: isOrgAdmin },
    { path: '/billing', icon: CreditCard, label: t('billing'), show: isOrgAdmin },
    { path: '/settings', icon: Settings, label: t('settings'), show: true },
  ];

  const displayEmail = authMode === 'demo' ? mockUser?.email : user?.email;
  const displayInitial = (authMode === 'demo' ? mockUser?.displayName?.[0] : user?.email?.[0])?.toUpperCase() || '?';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:h-16 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-6 min-w-0">
          <h1 className="font-heading text-lg font-bold text-foreground tracking-tight sm:text-xl shrink-0">
            Dash<span className="text-primary">Board</span>
          </h1>
          <div className="hidden sm:block">
            <OrgSwitcher />
          </div>
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.filter(n => n.show).map(item => (
              <Button key={item.path} variant={location.pathname === item.path ? 'secondary' : 'ghost'} size="sm" onClick={() => navigate(item.path)} className="gap-2">
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {authMode === 'demo' && (
            <Badge variant="secondary" className="hidden text-xs sm:inline-flex">Demo</Badge>
          )}
          <div className="hidden sm:block">
            <NotificationCenter />
          </div>
          <ThemeToggle />
          <Button variant="outline" size="icon" onClick={toggleLanguage} className="h-8 w-8 sm:h-9 sm:w-auto sm:gap-2 sm:px-3 font-medium">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{language === 'en' ? 'EN' : 'JA'}</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 px-1 sm:px-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {displayInitial}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
                {currentRole === 'super_admin' && <Shield className="h-3 w-3 text-destructive" />}
                {currentRole === 'org_admin' && <ShieldCheck className="h-3 w-3 text-primary" />}
                {currentRole === 'member' && <UserRound className="h-3 w-3 text-muted-foreground" />}
                <span className="capitalize">{currentRole === 'super_admin' ? t('superAdmin') : currentRole === 'org_admin' ? t('orgAdmin') : t('member')}</span>
              </div>
              <DropdownMenuSeparator />
              {/* Mobile-only: org name & notifications */}
              <div className="sm:hidden">
                <div className="px-2 py-1.5 text-xs font-medium text-foreground flex items-center gap-2">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  {currentOrg?.name || 'Organization'}
                </div>
                <DropdownMenuSeparator />
              </div>
              <div className="lg:hidden">
                {navItems.filter(n => n.show).map(item => (
                  <DropdownMenuItem key={item.path} onClick={() => navigate(item.path)}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </div>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
