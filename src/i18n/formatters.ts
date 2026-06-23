import { Language } from './translations';

const localeMap: Record<Language, string> = {
  en: 'en-US',
  ja: 'ja-JP',
};

const currencyMap: Record<Language, string> = {
  en: 'USD',
  ja: 'JPY',
};

export const formatCurrency = (amount: number, language: Language): string => {
  const locale = localeMap[language];
  const currency = currencyMap[language];
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(currency === 'JPY' ? Math.round(amount * 150) : amount);
};

export const formatDate = (date: Date, language: Language, timezone?: string): string => {
  const locale = localeMap[language];
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: language === 'en' ? 'short' : 'long',
    day: 'numeric',
    timeZone: timezone || undefined,
  }).format(date);
};

export const formatDateTime = (date: Date, language: Language, timezone?: string): string => {
  const locale = localeMap[language];
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: language === 'en' ? 'short' : 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone || undefined,
  }).format(date);
};

export const formatRelativeTime = (minutes: number, language: Language): string => {
  const locale = localeMap[language];
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'always', style: 'long' });

  if (Math.abs(minutes) < 60) {
    return rtf.format(-minutes, 'minute');
  }
  const hours = Math.floor(Math.abs(minutes) / 60);
  if (hours < 24) {
    return rtf.format(-hours, 'hour');
  }
  const days = Math.floor(hours / 24);
  return rtf.format(-days, 'day');
};

export const formatNumber = (value: number, language: Language): string => {
  return new Intl.NumberFormat(localeMap[language]).format(value);
};

export const formatPercent = (value: number, language: Language): string => {
  return new Intl.NumberFormat(localeMap[language], {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/** Format date in Japanese era (令和) when language is 'ja', otherwise standard */
export const formatJapaneseEraDate = (date: Date, language: Language): string => {
  if (language === 'ja') {
    return new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
      era: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
  return formatDate(date, language);
};

/** Short Japanese era format: 令和7年3月16日 */
export const formatJapaneseEraShort = (date: Date, language: Language): string => {
  if (language === 'ja') {
    return new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
      era: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(date);
  }
  return formatDate(date, language);
};
