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
      label: '必要 Cookie',
      description: '用于网站正常运行的必要 Cookie。这些 Cookie 无法被禁用。',
      required: true,
      defaultEnabled: true,
      gcmTypes: ['security_storage'],
    },
    analytics: {
      label: '分析 Cookie',
      description: '通过收集匿名使用数据，帮助我们了解访客如何使用本网站。',
      required: false,
      defaultEnabled: false,
      gcmTypes: ['analytics_storage'],
    },
    marketing: {
      label: '营销 Cookie',
      description: '用于提供更相关的内容与广告，并分析广告活动在不同网站上的表现。',
      required: false,
      defaultEnabled: false,
      gcmTypes: ['ad_storage', 'ad_user_data', 'ad_personalization'],
    },
    preferences: {
      label: '偏好 Cookie',
      description: '允许网站记住您的个性化设置，例如语言或深浅模式选择。',
      required: false,
      defaultEnabled: false,
      gcmTypes: ['functionality_storage', 'personalization_storage'],
    },
  },

  ui: {
    heading: 'Cookie 首选项',
    description: '本网站使用 Cookie 以提供个性化内容、分析访问情况并改善使用体验。点击「接受全部」即表示您同意我们使用所有 Cookie。您也可以选择「仅必要」或「自定义」来选择您希望启用的 Cookie 类型。访问《隐私政策》以详细了解我们如何使用 Cookie。',
    acceptAll: '接受全部',
    declineAll: '仅必要',
    customize: '自定义',
    savePreferences: '保存偏好设置',
    settingsHeading: 'Cookie 首选项',
    alwaysOnLabel: '始终开启',
    privacyPolicyLabel: '进一步了解',
  },

  /** Milliseconds before banner slides in */
  showDelay: 500,
};

export default consentConfig;
