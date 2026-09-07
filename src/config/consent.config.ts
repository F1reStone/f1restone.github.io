import { defaultLocale, t, tData } from '@/i18n';
import type { ConsentConfig } from '@/lib/consent.types';

const consentConfig: ConsentConfig = {
  /** Bump to force re-consent when categories change */
  version: 1,

  /** 'consent_mode_v2' = scripts load with denied defaults, cookieless pings
   *  'strict' = scripts fully blocked until consent granted */
  mode: 'strict',

  /** localStorage key for stored preferences */
  storageKey: 'cookie-consent',

  categories: {
    necessary: {
      label: t('consent.categories.necessary.label', defaultLocale),
      description: t('consent.categories.necessary.description', defaultLocale),
      required: true,
      defaultEnabled: true,
      gcmTypes: ['security_storage'],
    },
    analytics: {
      label: t('consent.categories.analytics.label', defaultLocale),
      description: t('consent.categories.analytics.description', defaultLocale),
      required: false,
      defaultEnabled: false,
      gcmTypes: ['analytics_storage'],
    },
    marketing: {
      label: t('consent.categories.marketing.label', defaultLocale),
      description: t('consent.categories.marketing.description', defaultLocale),
      required: false,
      defaultEnabled: false,
      gcmTypes: ['ad_storage', 'ad_user_data', 'ad_personalization'],
    },
    preferences: {
      label: t('consent.categories.preferences.label', defaultLocale),
      description: t('consent.categories.preferences.description', defaultLocale),
      required: false,
      defaultEnabled: false,
      gcmTypes: ['functionality_storage', 'personalization_storage'],
    },
  },

  ui: tData<ConsentConfig['ui']>('consent', defaultLocale)!,

  /** Milliseconds before banner slides in */
  showDelay: 500,
};

export default consentConfig;
