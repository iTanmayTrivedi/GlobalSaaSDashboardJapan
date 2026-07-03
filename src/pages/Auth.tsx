import { useState } from 'react';
import { useAuth, AuthMode } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Loader2, AlertTriangle, Monitor, Cloud, ArrowRight, Eye, EyeOff, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { AppRole } from '@/contexts/OrgContext';
import { signInSchema, signUpSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-error';
import { checkRateLimit } from '@/lib/rate-limit';
import { MOCK_USERS } from '@/lib/mock-auth';
import AuthShowcase from '@/components/auth/AuthShowcase';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const { isAuthenticated, loading, signIn, signUp, mockSignIn, authMode, setAuthMode, supabaseAvailable } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('member');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!checkRateLimit('auth', { maxAttempts: 5, windowMs: 60_000 })) {
      toast.error(t('rateLimitExceeded'));
      return;
    }

    if (isLogin) {
      const result = signInSchema.safeParse({ email, password });
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach(issue => { errors[issue.path[0] as string] = issue.message; });
        setFieldErrors(errors);
        return;
      }
    } else {
      const result = signUpSchema.safeParse({ email, password, confirmPassword, displayName, selectedRole });
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach(issue => { errors[issue.path[0] as string] = issue.message; });
        setFieldErrors(errors);
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) handleApiError(error);
      } else {
        const { error } = await signUp(email, password, displayName, selectedRole);
        if (error) handleApiError(error);
        else toast.success(t('signup'));
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        handleApiError(error);
        setSubmitting(false);
      }
      // On success the browser is redirected to Google.
    } catch (err) {
      handleApiError(err);
      setSubmitting(false);
    }
  };

  const roleLabel = (role: AppRole) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'org_admin': return 'Admin / Manager';
      case 'member': return 'Member';
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Auth form */}
      <div className="flex flex-1 flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-20 relative">
        {/* Language toggle */}
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <Button variant="ghost" size="sm" onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')} className="gap-2 text-muted-foreground hover:text-foreground">
            <Globe className="h-4 w-4" />
            {language === 'en' ? 'EN' : 'JA'}
          </Button>
        </div>

        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <div className="mb-10">
            <div className="font-heading text-3xl font-bold tracking-tight">
              Dash<span className="text-primary">Board</span>
            </div>
            <p className="mt-2 text-muted-foreground text-sm">
              {authMode === 'demo'
                ? 'Select a demo user to explore'
                : isLogin ? t('loginSubtitle') : t('signupSubtitle')}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setAuthMode('demo')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                authMode === 'demo'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Monitor className="h-4 w-4" />
              Demo
            </button>
            <button
              onClick={() => {
                if (!supabaseAvailable) {
                  toast.error('Backend not configured. Using demo mode.');
                  return;
                }
                setAuthMode('supabase');
              }}
              disabled={!supabaseAvailable}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                authMode === 'supabase'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Cloud className="h-4 w-4" />
              {t('loginTitle')}
            </button>
          </div>

          {authMode === 'demo' ? (
            /* ============ DEMO MODE ============ */
            <div className="space-y-2.5">
              {MOCK_USERS.map(u => (
                <button
                  key={u.id}
                  onClick={() => mockSignIn(u.id)}
                  className="w-full flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3.5 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-sm group"
                >
                  <div>
                    <div className="font-medium text-sm text-foreground">{u.displayName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium capitalize rounded-full bg-accent px-2.5 py-1 text-accent-foreground">
                      {roleLabel(u.role)}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  </div>
                </button>
              ))}
              <p className="pt-3 text-center text-xs text-muted-foreground">
                {t('demoDesc')}
              </p>
            </div>
          ) : (
            /* ============ SUPABASE MODE ============ */
            <>
              <form onSubmit={handleSupabaseSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="displayName" className="text-xs font-medium text-muted-foreground">{t('displayName')}</Label>
                      <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('displayName')} maxLength={100} className="h-11 rounded-xl border-border/60 bg-card focus:border-primary" />
                      {fieldErrors.displayName && <p className="text-xs text-destructive">{fieldErrors.displayName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">{t('selectRole')}</Label>
                      <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                        <SelectTrigger className="h-11 rounded-xl border-border/60 bg-card"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">{t('superAdmin')}</SelectItem>
                          <SelectItem value="org_admin">{t('orgAdmin')}</SelectItem>
                          <SelectItem value="member">{t('member')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="flex items-center gap-1.5 text-[11px] text-destructive">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {t('demoWarning')}
                      </p>
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">{t('email')}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="h-11 rounded-xl border-border/60 bg-card focus:border-primary" />
                  {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">{t('password')}</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-11 rounded-xl border-border/60 bg-card focus:border-primary pr-10" />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl font-medium text-sm" disabled={submitting}>
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isLogin ? t('login') : t('signup')}</> : (
                    <span className="flex items-center gap-2">
                      {isLogin ? t('login') : t('signup')}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {language === 'ja' ? 'または' : 'or continue with'}
                  </span>
                </div>
              </div>

              {/* Google sign-in */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full h-11 rounded-xl font-medium text-sm border-border/60 bg-card hover:bg-accent gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {language === 'ja' ? 'Googleで続ける' : 'Continue with Google'}
              </Button>

              <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
                {isLogin && (
                  <Link to="/forgot-password" className="block text-xs font-medium text-primary hover:underline">
                    {t('forgotPassword')}
                  </Link>
                )}
                <div className="text-xs">
                  {isLogin ? t('noAccount') : t('hasAccount')}{' '}
                  <button onClick={() => { setIsLogin(!isLogin); setFieldErrors({}); }} className="font-medium text-primary hover:underline">
                    {isLogin ? t('signup') : t('login')}
                  </button>
                </div>
              </div>
            </>
          )}

          {!supabaseAvailable && authMode === 'demo' && (
            <p className="mt-4 text-center text-[11px] text-muted-foreground">Backend unavailable — demo mode only</p>
          )}
        </div>
      </div>

      {/* Right side - Interactive showcase */}
      <AuthShowcase />
    </div>
  );
};

export default Auth;
